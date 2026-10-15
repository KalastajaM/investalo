import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { extractPageText } from "./scraper";
import { CLAUDE_MODEL, parseClaudeJson } from "./claude-utils";
import { AppError } from "./errors";
import { safeFetch } from "./safe-fetch";

export interface InvestmentAnalysis {
  verdict: "good" | "caution" | "poor";
  summary: string;
  positives: string[];
  flags: string[];
  recommendation: string;
}

const SYSTEM_PROMPT_TEMPLATE = (guardrails: string) =>
  `You are an expert investment property analyst. Use the investment guardrails below to evaluate the property listing provided by the user. Apply the red and orange flag criteria from the guardrails when reviewing the listing content.

${guardrails}

Respond with ONLY a JSON object — no markdown, no explanation, no code fences.

JSON shape (use empty arrays if none apply):
{
  "verdict": "good" | "caution" | "poor",
  "summary": string,
  "positives": string[],
  "flags": string[],
  "recommendation": string
}

Guidelines:
- "good": The listing shows a sound investment with no major red flags
- "caution": One or more orange flags present, or insufficient information to fully assess
- "poor": One or more red flags present, or fundamentals do not support investment
- summary: 2-4 sentences explaining the overall assessment
- positives: Up to 5 specific positive aspects from the listing (empty array if none)
- flags: Any red or orange flags identified based on the guardrails (empty array if none)
- recommendation: 1-2 sentences of actionable advice for the investor`;

// Cached guardrails content — loaded lazily on first use rather than at module init.
// A missing file returns a 503 per-request instead of crashing server startup.
let _guardrailsCache: string | undefined;

async function loadGuardrails(): Promise<string> {
  if (_guardrailsCache !== undefined) return _guardrailsCache;
  const filePath = path.resolve(process.cwd(), "investment-property-guardrails.md");
  try {
    _guardrailsCache = await fs.promises.readFile(filePath, "utf-8");
    return _guardrailsCache;
  } catch {
    throw new AppError(
      503,
      "Investment analysis is temporarily unavailable (guardrails configuration missing).",
    );
  }
}

export async function analyzePropertyInvestment(url: string): Promise<InvestmentAnalysis> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your environment variables to use investment analysis.",
    );
  }

  const guardrailsText = await loadGuardrails();

  const resp = await safeFetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fi-FI,fi;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch URL: ${resp.status} ${resp.statusText}`);
  }

  const html = await resp.text();
  const $ = cheerio.load(html);
  const pageText = extractPageText($);

  const client = new Anthropic();
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT_TEMPLATE(guardrailsText),
    messages: [{ role: "user", content: `URL: ${url}\n\n${pageText}` }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "The property listing is too long to analyze. Try a listing with less text.",
    );
  }

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
  const d = parseClaudeJson(raw);

  const verdict = d.verdict === "good" || d.verdict === "poor" ? d.verdict : "caution";
  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  return {
    verdict,
    summary: typeof d.summary === "string" ? d.summary : "Unable to generate summary.",
    positives: toStringArray(d.positives),
    flags: toStringArray(d.flags),
    recommendation: typeof d.recommendation === "string" ? d.recommendation : "",
  };
}

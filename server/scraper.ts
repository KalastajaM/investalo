import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { CLAUDE_MODEL, extractClaudeText, parseClaudeJson } from "./claude-utils";
import { safeFetch } from "./safe-fetch";

export interface ScrapedProperty {
  name?: string;
  address?: string;
  city?: string;
  area?: string;
  sizeM2?: string;
  buildYear?: number;
  purchasePrice?: string;
  debtFreePrice?: string;
  maintenanceFeePerMonth?: string;
  financeFeePerMonth?: string;
  waterFeePerMonth?: string;
  rooms?: string;
  notes?: string;
  customLink?: string;
}

const SYSTEM_PROMPT = `You extract real estate listing data from web page content.
Respond with ONLY a JSON object — no markdown, no explanation, no code fences.

JSON shape (use null for missing fields):
{
  "address": string | null,
  "city": string | null,
  "area": string | null,
  "sizeM2": number | null,
  "buildYear": integer | null,
  "rooms": string | null,
  "purchasePrice": integer | null,
  "debtFreePrice": integer | null,
  "maintenanceFeePerMonth": number | null,
  "financeFeePerMonth": number | null,
  "waterFeePerMonth": number | null
}

Finnish terminology (oikotie.fi, etuovi.com):
- Myyntihinta  → purchasePrice  (selling price — the LOWER number, paid to the seller)
- Velaton hinta → debtFreePrice (debt-free price — HIGHER, includes housing company loan)
- Hoitovastike  → maintenanceFeePerMonth
- Pääomavastike / Rahoitusvastike → financeFeePerMonth
- Vesimaksu     → waterFeePerMonth
- Kaupunginosa  → area
- Kaupunki / Kunta → city
- Rakennusvuosi → buildYear
- Asuinpinta-ala / Pinta-ala → sizeM2 (m²)
- Huoneistokokoonpano / Huoneisto → rooms (e.g. "3h+k+s")

All prices and fees must be plain numbers — no spaces, no currency symbol (134300 not "134 300 €").`;

/** Strip navigation, scripts and boilerplate; return clean visible text. */
export function extractPageText($: cheerio.CheerioAPI): string {
  $(
    "script, style, noscript, nav, header, footer, " +
    "[role='navigation'], [role='banner'], [role='contentinfo'], " +
    ".cookie-notice, .cookie-banner, .cookie-consent, iframe, svg",
  ).remove();

  const main = $("main, [role='main'], article, #main-content, .listing-details").first();
  const root = main.length ? main : $("body");

  return root
    .text()
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 10000);
}

export async function scrapePropertyUrl(url: string): Promise<ScrapedProperty> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your environment variables to use URL import.",
    );
  }

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
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const pageText = extractPageText($);

  const client = new Anthropic();
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096, // covers adaptive thinking as well as the JSON answer
    output_config: { effort: "low" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `URL: ${url}\n\n${pageText}` }],
  });

  const raw = extractClaudeText(response);
  const d = parseClaudeJson(raw);

  const str = (v: unknown) => (v != null ? String(v) : undefined);
  const address = str(d.address);

  return {
    customLink: url,
    name: address ?? ogTitle ?? undefined,
    address,
    city: str(d.city),
    area: str(d.area),
    sizeM2: d.sizeM2 != null ? String(d.sizeM2) : undefined,
    buildYear: typeof d.buildYear === "number" ? d.buildYear : undefined,
    rooms: str(d.rooms),
    purchasePrice: d.purchasePrice != null ? String(d.purchasePrice) : undefined,
    debtFreePrice: d.debtFreePrice != null ? String(d.debtFreePrice) : undefined,
    maintenanceFeePerMonth: d.maintenanceFeePerMonth != null ? String(d.maintenanceFeePerMonth) : undefined,
    financeFeePerMonth: d.financeFeePerMonth != null ? String(d.financeFeePerMonth) : undefined,
    waterFeePerMonth: d.waterFeePerMonth != null ? String(d.waterFeePerMonth) : undefined,
  };
}

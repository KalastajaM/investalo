/** Shared Claude API utilities used across analyzer, market-analyzer, and scraper. */
import type Anthropic from "@anthropic-ai/sdk";
import { AppError } from "./errors";

/**
 * Claude model used for all AI features. Override via CLAUDE_MODEL env var.
 * Requests set output_config.effort, so an override must be a model that supports
 * effort (Claude Haiku 5.5 or a current Sonnet/Opus); Claude Haiku 4.5 rejects it.
 */
export const CLAUDE_MODEL: string = process.env.CLAUDE_MODEL ?? "claude-haiku-5-5";

/**
 * Return the text answer from a Claude response.
 * Claude Haiku 5.5 thinks by default, so the response can begin with `thinking`
 * blocks: text is read by block type, never by position. A safety decline
 * (stop_reason "refusal") or a response cut off by max_tokens raises an AppError,
 * whose message the API returns to the client.
 */
export function extractClaudeText(response: Anthropic.Message): string {
  if (response.stop_reason === "refusal") {
    throw new AppError(422, "Claude declined to analyze this content.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new AppError(502, "Claude's response was cut off before it finished. Please try again.");
  }
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new AppError(502, "Claude returned an empty response. Please try again.");
  return text;
}

/**
 * Parse the raw text output from a Claude API response into a plain object.
 * Strips accidental markdown code fences (``` ... ```) before parsing.
 * Throws with up to 200 chars of context on JSON parse failure.
 */
export function parseClaudeJson(raw: string): Record<string, unknown> {
  const text = raw
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${text.slice(0, 200)}`);
  }
}

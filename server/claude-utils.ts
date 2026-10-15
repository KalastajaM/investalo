/** Shared Claude API utilities used across analyzer, market-analyzer, and scraper. */

/** Claude model used for all AI features. Override via CLAUDE_MODEL env var. */
export const CLAUDE_MODEL: string =
  process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";

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

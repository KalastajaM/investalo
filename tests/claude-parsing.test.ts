import { describe, it, expect } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJson, extractClaudeText, CLAUDE_MODEL } from "../server/claude-utils";
import { AppError } from "../server/errors";

// ---------------------------------------------------------------------------
// parseClaudeJson
// ---------------------------------------------------------------------------

describe("parseClaudeJson", () => {
  it("parses valid bare JSON", () => {
    const result = parseClaudeJson('{"verdict": "good", "summary": "Looks fine"}');
    expect(result).toEqual({ verdict: "good", summary: "Looks fine" });
  });

  it("strips markdown json code fence and parses", () => {
    const input = '```json\n{"key": "value"}\n```';
    const result = parseClaudeJson(input);
    expect(result).toEqual({ key: "value" });
  });

  it("strips generic code fence (no language tag) and parses", () => {
    const input = '```\n{"key": 42}\n```';
    const result = parseClaudeJson(input);
    expect(result).toEqual({ key: 42 });
  });

  it("strips opening fence without closing and parses", () => {
    const input = '```json\n{"key": true}';
    const result = parseClaudeJson(input);
    expect(result).toEqual({ key: true });
  });

  it("handles whitespace around JSON", () => {
    const result = parseClaudeJson('  \n  {"a": 1}  \n  ');
    expect(result).toEqual({ a: 1 });
  });

  it("throws on malformed JSON with context snippet", () => {
    const bad = "not json at all";
    expect(() => parseClaudeJson(bad)).toThrowError(/Claude returned invalid JSON/);
    expect(() => parseClaudeJson(bad)).toThrowError(/not json at all/);
  });

  it("throws on truncated JSON", () => {
    const truncated = '{"verdict": "good", "summary":';
    expect(() => parseClaudeJson(truncated)).toThrowError(/Claude returned invalid JSON/);
  });

  it("includes up to 200 chars of context in the error message", () => {
    const longBad = "x".repeat(300);
    let message = "";
    try {
      parseClaudeJson(longBad);
    } catch (e) {
      message = (e as Error).message;
    }
    // Should contain the first 200 chars, not the full 300-char string
    expect(message).toContain("x".repeat(200));
    expect(message).not.toContain("x".repeat(201));
  });

  it("parses empty object", () => {
    expect(parseClaudeJson("{}")).toEqual({});
  });

  it("parses arrays wrapped as top-level value (via unknown cast)", () => {
    // parseClaudeJson returns Record<string, unknown> but JSON.parse handles arrays too
    // Verify no crash
    expect(() => parseClaudeJson("[1,2,3]")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// CLAUDE_MODEL
// ---------------------------------------------------------------------------

describe("CLAUDE_MODEL", () => {
  it("defaults to claude-haiku-5-5 when env var is not set", async () => {
    // The env var is not set in the test environment
    const { CLAUDE_MODEL: model } = await import("../server/claude-utils");
    expect(model).toBe(process.env.CLAUDE_MODEL ?? "claude-haiku-5-5");
  });

  it("is a non-empty string", () => {
    expect(typeof CLAUDE_MODEL).toBe("string");
    expect(CLAUDE_MODEL.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// extractClaudeText
// ---------------------------------------------------------------------------

function message(
  content: Array<Record<string, unknown>>,
  stop_reason: Anthropic.StopReason = "end_turn",
): Anthropic.Message {
  return { id: "msg_test", type: "message", role: "assistant", model: "claude-haiku-5-5", content, stop_reason } as unknown as Anthropic.Message;
}

describe("extractClaudeText", () => {
  it("returns the text when the response starts with a thinking block", () => {
    const res = message([
      { type: "thinking", thinking: "", signature: "sig" },
      { type: "text", text: ' {"verdict": "good"} ' },
    ]);
    expect(extractClaudeText(res)).toBe('{"verdict": "good"}');
  });

  it("joins multiple text blocks", () => {
    const res = message([{ type: "text", text: '{"a":' }, { type: "text", text: " 1}" }]);
    expect(parseClaudeJson(extractClaudeText(res))).toEqual({ a: 1 });
  });

  it("throws a 422 AppError on a safety refusal", () => {
    const res = message([], "refusal");
    expect(() => extractClaudeText(res)).toThrow(AppError);
    expect(() => extractClaudeText(res)).toThrow(expect.objectContaining({ status: 422 }));
  });

  it("throws when max_tokens cut the response off, even after thinking", () => {
    const res = message([{ type: "thinking", thinking: "", signature: "sig" }], "max_tokens");
    expect(() => extractClaudeText(res)).toThrow(expect.objectContaining({ status: 502 }));
  });

  it("throws when the response has no text block", () => {
    const res = message([{ type: "thinking", thinking: "", signature: "sig" }]);
    expect(() => extractClaudeText(res)).toThrow(/empty response/);
  });
});

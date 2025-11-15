import { describe, expect, it } from "vitest";
import { sanitizeString } from "../../src/lib/validation/search";

describe("sanitizeString", () => {
  it("trims whitespace and truncates over limit", () => {
    const input = "  " + "a".repeat(300) + "  ";
    const result = sanitizeString(input, 255);
    expect(result.length).toBe(255);
    expect(result).toBe("a".repeat(255));
  });

  it("returns input unchanged when within limit", () => {
    const input = "hello world";
    const result = sanitizeString(input, 255);
    expect(result).toBe(input);
  });

  it("handles empty input after trim", () => {
    const input = "   ";
    const result = sanitizeString(input, 10);
    expect(result).toBe("");
  });

  it("handles exact max length", () => {
    const input = "x".repeat(255);
    const result = sanitizeString(input, 255);
    expect(result).toBe(input);
  });
});
import { describe, expect, it } from "vitest";

import { assertValidCasualFeedbackText } from "./domain";

describe("casual feedback domain", () => {
  it("accepts non-empty text", () => {
    expect(() =>
      assertValidCasualFeedbackText("Had a great pairing session."),
    ).not.toThrow();
  });

  it("rejects empty text", () => {
    expect(() => assertValidCasualFeedbackText("")).toThrow("required");
  });

  it("rejects whitespace-only text", () => {
    expect(() => assertValidCasualFeedbackText("   ")).toThrow("required");
  });
});

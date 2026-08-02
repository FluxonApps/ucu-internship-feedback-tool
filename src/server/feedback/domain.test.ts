import { describe, expect, it } from "vitest";

import { feedbackCriteria } from "@/lib/feedback/definitions";

import { assertValidEvaluationRange, assertValidFeedbackAnswers } from "./domain";

const completeRatings = Object.fromEntries(
  feedbackCriteria.map((criterion) => [criterion.value, 4]),
);

const completeAnswers = {
  ratings: completeRatings,
  positiveFeedback: "Dependable delivery",
  constructiveFeedback: "Break work into smaller milestones",
  managerOnlyFeedback: "Ready for more ownership",
  customAnswers: { "question-1": "Lead a small feature" },
};

describe("feedback domain", () => {
  it("accepts an inclusive evaluation range", () => {
    const date = new Date("2026-07-01T00:00:00.000Z");
    expect(() => assertValidEvaluationRange(date, date)).not.toThrow();
  });

  it("rejects an inverted evaluation range", () => {
    expect(() =>
      assertValidEvaluationRange(
        new Date("2026-07-31T00:00:00.000Z"),
        new Date("2026-07-01T00:00:00.000Z"),
      ),
    ).toThrow("end date");
  });

  it("allows incomplete known answers in a draft", () => {
    expect(() =>
      assertValidFeedbackAnswers(
        {
          ratings: { communication: 4 },
          positiveFeedback: "",
          constructiveFeedback: "",
          managerOnlyFeedback: "",
          customAnswers: {},
        },
        [{ id: "question-1", prompt: "Focus next month" }],
        false,
      ),
    ).not.toThrow();
  });

  it("rejects unknown criteria and questions even in a draft", () => {
    expect(() =>
      assertValidFeedbackAnswers(
        { ...completeAnswers, ratings: { unknown: 4 } },
        [{ id: "question-1", prompt: "Focus next month" }],
        false,
      ),
    ).toThrow("Unknown feedback criterion");
    expect(() =>
      assertValidFeedbackAnswers(
        { ...completeAnswers, customAnswers: { unknown: "answer" } },
        [{ id: "question-1", prompt: "Focus next month" }],
        false,
      ),
    ).toThrow("Unknown additional feedback question");
  });

  it("requires every score and public answer on submission", () => {
    expect(() =>
      assertValidFeedbackAnswers(
        { ...completeAnswers, ratings: { communication: 4 } },
        [{ id: "question-1", prompt: "Focus next month" }],
        true,
      ),
    ).toThrow("Rate every skill");
    expect(() =>
      assertValidFeedbackAnswers(
        { ...completeAnswers, positiveFeedback: " " },
        [{ id: "question-1", prompt: "Focus next month" }],
        true,
      ),
    ).toThrow("what the intern was doing well");
    expect(() =>
      assertValidFeedbackAnswers(
        { ...completeAnswers, customAnswers: {} },
        [{ id: "question-1", prompt: "Focus next month" }],
        true,
      ),
    ).toThrow("additional question");
  });

  it("accepts a complete submission", () => {
    expect(() =>
      assertValidFeedbackAnswers(
        completeAnswers,
        [{ id: "question-1", prompt: "Focus next month" }],
        true,
      ),
    ).not.toThrow();
  });
});

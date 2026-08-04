import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import { feedbackCycleDocumentSchema } from "./models";

const auditFields = {
  createdAt: Timestamp.now(),
  createdBy: "manager-id",
  updatedAt: Timestamp.now(),
  updatedBy: "manager-id",
};

describe("feedback Firestore models", () => {
  it("accepts a valid feedback cycle document", () => {
    expect(
      feedbackCycleDocumentSchema.parse({
        ...auditFields,
        evaluationStartsAt: Timestamp.now(),
        evaluationEndsAt: Timestamp.now(),
        questionnaireVersion: 1,
        customQuestions: [],
        reviewerCount: 3,
      }).reviewerCount,
    ).toBe(3);
  });

  it("rejects a feedback cycle with negative reviewers", () => {
    expect(() =>
      feedbackCycleDocumentSchema.parse({
        ...auditFields,
        evaluationStartsAt: Timestamp.now(),
        evaluationEndsAt: Timestamp.now(),
        questionnaireVersion: 1,
        customQuestions: [],
        reviewerCount: -5,
      }),
    ).toThrow();
  });
});

import { describe, expect, it } from "vitest";

import type { ReviewerStatusDto } from "./types";
import {
  aggregateFeedbackRatings,
  buildFeedbackPublicationPreview,
  feedbackCycleState,
} from "./publication";

const reviewer = (
  id: string,
  name: string,
  communication: 1 | 2 | 3 | 4 | 5,
): ReviewerStatusDto => ({
  reviewerUserId: id,
  reviewerDisplayName: name,
  responsibilities: id === "a" ? ["teamLead", "mentor"] : [],
  status: "submitted",
  response: {
    ratings: { communication },
    positiveFeedback: `${name} positive`,
    constructiveFeedback: `${name} constructive`,
    managerOnlyFeedback: `${name} private`,
    customAnswers: { "question-1": `${name} custom` },
  },
});

describe("feedback publication", () => {
  it("derives terminal states before collecting", () => {
    expect(feedbackCycleState({})).toBe("collecting");
    expect(feedbackCycleState({ publishedAt: "now" })).toBe("published");
    expect(feedbackCycleState({ cancelledAt: "now", publishedAt: "then" })).toBe(
      "cancelled",
    );
  });

  it("rounds arithmetic means to the nearest whole rating", () => {
    expect(
      aggregateFeedbackRatings([
        reviewer("a", "Alice", 3).response!,
        reviewer("b", "Bob", 4).response!,
      ]),
    ).toMatchObject({ communication: 4 });
    expect(aggregateFeedbackRatings([])).toEqual({});
  });

  it("builds an attributed public allowlist without manager-only feedback", () => {
    const preview = buildFeedbackPublicationPreview(
      [reviewer("b", "Bob", 4), reviewer("a", "Alice", 3)],
      [{ id: "question-1", prompt: "Next focus" }],
    );
    expect(preview.submittedReviewerCount).toBe(2);
    expect(
      preview.questions[0].answers.map((answer) => answer.reviewerDisplayName),
    ).toEqual(["Alice", "Bob"]);
    expect(JSON.stringify(preview)).not.toContain("private");
    expect(JSON.stringify(preview)).not.toContain("managerOnlyFeedback");
  });
});

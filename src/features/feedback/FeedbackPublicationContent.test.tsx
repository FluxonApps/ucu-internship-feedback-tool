import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { PublishedFeedbackDto } from "@/lib/feedback/types";

import { FeedbackPublicationContent } from "./ui/FeedbackPublicationContent";

const publication: PublishedFeedbackDto = {
  internshipId: "internship-1",
  internDisplayName: "Ivy Intern",
  cycleId: "cycle-1",
  evaluationStartsAt: "2026-07-01T00:00:00.000Z",
  evaluationEndsAt: "2026-07-31T00:00:00.000Z",
  publishedAt: "2026-08-02T00:00:00.000Z",
  publishedByDisplayName: "Maya Manager",
  managerRecommendation: "Lead the next scoped feature.",
  reviewerCount: 2,
  submittedReviewerCount: 1,
  missingReviewerNames: ["Morgan Mentor"],
  ratings: { communication: 4 },
  questions: [
    {
      id: "positiveFeedback",
      prompt: "What the intern was doing well",
      answers: [
        {
          reviewerUserId: "lead-1",
          reviewerDisplayName: "Taylor Lead",
          responsibilities: ["teamLead", "mentor"],
          answer: "Communicates clearly.",
        },
      ],
    },
  ],
};

describe("FeedbackPublicationContent", () => {
  it("renders labels, attribution, public text, and the manager recommendation", () => {
    const markup = renderToStaticMarkup(
      <FeedbackPublicationContent publication={publication} />,
    );

    expect(markup).toContain("Meets Expectations");
    expect(markup).toContain("Taylor Lead (Mentor, Team lead)");
    expect(markup).toContain("Communicates clearly.");
    expect(markup).toContain("Maya Manager");
    expect(markup).toContain("Lead the next scoped feature.");
    expect(markup).not.toContain("4 / 5");
  });
});

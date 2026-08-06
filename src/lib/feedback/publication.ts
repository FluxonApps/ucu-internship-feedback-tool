import {
  feedbackCriteria,
  standardFeedbackFields,
  type FeedbackCriterion,
  type FeedbackRating,
} from "./definitions";
import { calculateHealthScore } from "./health-score";
import type {
  FeedbackAnswersDto,
  FeedbackCycleState,
  FeedbackPublicationPreviewDto,
  PublishedAnswerDto,
  ReviewerStatusDto,
} from "./types";

export function feedbackCycleState(value: {
  cancelledAt?: unknown;
  publishedAt?: unknown;
}): FeedbackCycleState {
  if (value.cancelledAt) return "cancelled";
  if (value.publishedAt) return "published";
  return "collecting";
}

export function aggregateFeedbackRatings(
  responses: FeedbackAnswersDto[],
): Partial<Record<FeedbackCriterion, FeedbackRating>> {
  return Object.fromEntries(
    feedbackCriteria.flatMap((criterion) => {
      const values = responses.flatMap((response) => {
        const value = response.ratings[criterion.value];
        return value === undefined ? [] : [value];
      });
      if (!values.length) return [];
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      return [[criterion.value, Math.round(average) as FeedbackRating]];
    }),
  );
}

function publicAnswer(
  reviewer: ReviewerStatusDto,
  answer: string | undefined,
): PublishedAnswerDto | undefined {
  if (!answer?.trim()) return undefined;

  let overallScore: number | undefined = undefined;
  let softScore: number | undefined = undefined;
  let techScore: number | undefined = undefined;

  if (reviewer.response?.ratings) {
    const scores = calculateHealthScore(reviewer.response.ratings);
    overallScore = scores.overallAverage;
    softScore = scores.softAverage;
    techScore = scores.technicalAverage;
  }

  return {
    reviewerUserId: reviewer.reviewerUserId,
    reviewerDisplayName: reviewer.reviewerDisplayName,
    responsibilities: reviewer.responsibilities,
    answer,
    overallScore,
    softScore,
    techScore,
  } as PublishedAnswerDto & { overallScore?: number; softScore?: number; techScore?: number };
}

export function buildFeedbackPublicationPreview(
  reviewers: ReviewerStatusDto[],
  customQuestions: Array<{ id: string; prompt: string }>,
): FeedbackPublicationPreviewDto {
  const ordered = [...reviewers].sort(
    (a, b) =>
      a.reviewerDisplayName.localeCompare(b.reviewerDisplayName) ||
      a.reviewerUserId.localeCompare(b.reviewerUserId),
  );
  const submitted = ordered.filter(
    (reviewer) => reviewer.status === "submitted" && reviewer.response,
  );
  const questionDefinitions = [
    ...standardFeedbackFields
      .filter((field) => field.visibility === "public")
      .map((field) => ({ id: field.value, prompt: field.label })),
    ...customQuestions,
  ];

  return {
    reviewerCount: reviewers.length,
    submittedReviewerCount: submitted.length,
    missingReviewerNames: ordered
      .filter((reviewer) => reviewer.status !== "submitted")
      .map((reviewer) => reviewer.reviewerDisplayName),
    ratings: aggregateFeedbackRatings(
      submitted.flatMap((reviewer) => (reviewer.response ? [reviewer.response] : [])),
    ),
    questions: questionDefinitions.map((question) => ({
      ...question,
      answers: submitted.flatMap((reviewer) => {
        const response = reviewer.response;
        if (!response) return [];
        const answer =
          question.id === "positiveFeedback"
            ? response.positiveFeedback
            : question.id === "constructiveFeedback"
              ? response.constructiveFeedback
              : response.customAnswers[question.id];
        const projected = publicAnswer(reviewer, answer);
        return projected ? [projected] : [];
      }),
    })),
  };
}

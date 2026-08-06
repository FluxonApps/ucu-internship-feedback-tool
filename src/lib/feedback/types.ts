import type { FeedbackCriterion, FeedbackRating } from "./definitions";
import type { TeammateResponsibility } from "../teammate-responsibilities";

export type FeedbackCycleState = "collecting" | "published" | "cancelled";

export type CustomFeedbackQuestion = {
  id: string;
  prompt: string;
};

export type FeedbackAnswersDto = {
  ratings: Partial<Record<FeedbackCriterion, FeedbackRating>>;
  positiveFeedback: string;
  constructiveFeedback: string;
  managerOnlyFeedback: string;
  customAnswers: Record<string, string>;
};

export type ReviewerStatusDto = {
  reviewerUserId: string;
  reviewerDisplayName: string;
  responsibilities: TeammateResponsibility[];
  status: "notStarted" | "draft" | "submitted";
  submittedAt?: string;
  response?: FeedbackAnswersDto;
  softScore?: number;
  techScore?: number;
};

export type FeedbackCycleDto = {
  id: string;
  evaluationStartsAt: string;
  evaluationEndsAt: string;
  dueAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  publishedAt?: string;
  publishedByDisplayName?: string;
  managerRecommendation?: string;
  state: FeedbackCycleState;
  customQuestions: CustomFeedbackQuestion[];
  reviewers: ReviewerStatusDto[];
  publicationPreview: FeedbackPublicationPreviewDto;
};

export type TeammateFeedbackDto = {
  cycle: FeedbackCycleDto;
  reviewer: ReviewerStatusDto;
};

export type PublishedAnswerDto = {
  reviewerUserId: string;
  reviewerDisplayName: string;
  responsibilities: TeammateResponsibility[];
  answer: string;
};

export type PublishedQuestionDto = {
  id: string;
  prompt: string;
  answers: PublishedAnswerDto[];
};

export type FeedbackPublicationPreviewDto = {
  reviewerCount: number;
  submittedReviewerCount: number;
  missingReviewerNames: string[];
  ratings: Partial<Record<FeedbackCriterion, FeedbackRating>>;
  questions: PublishedQuestionDto[];
};

export type PublishedFeedbackDto = FeedbackPublicationPreviewDto & {
  internshipId: string;
  internId: string;
  internDisplayName: string;
  cycleId: string;
  evaluationStartsAt: string;
  evaluationEndsAt: string;
  publishedAt: string;
  publishedByDisplayName: string;
  managerRecommendation: string;
};

export type PublishedInternshipSummaryDto = {
  internshipId: string;
  internDisplayName: string;
  latestPublishedAt: string;
  publishedCycleCount: number;
};

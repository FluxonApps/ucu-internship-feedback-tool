import "server-only";

import { feedbackCriteria, type FeedbackCriterion } from "@/lib/feedback/definitions";

import type { FeedbackAnswersInput } from "./schemas";

export type FeedbackQuestion = { id: string; prompt: string };

export function assertValidEvaluationRange(startsAt: Date, endsAt: Date) {
  if (endsAt < startsAt) {
    throw new Error("The evaluation end date cannot be before its start date.");
  }
}

export function assertValidFeedbackAnswers(
  answers: FeedbackAnswersInput,
  questions: FeedbackQuestion[],
  requireComplete: boolean,
) {
  const expectedCriteria = new Set(
    feedbackCriteria.map((criterion) => criterion.value),
  );
  const suppliedCriteria = Object.keys(answers.ratings);
  if (suppliedCriteria.some((key) => !expectedCriteria.has(key as FeedbackCriterion))) {
    throw new Error("Unknown feedback criterion.");
  }

  const questionIds = new Set(questions.map((question) => question.id));
  if (Object.keys(answers.customAnswers).some((id) => !questionIds.has(id))) {
    throw new Error("Unknown additional feedback question.");
  }
  if (!requireComplete) return;

  if (suppliedCriteria.length !== expectedCriteria.size) {
    throw new Error("Rate every skill before submitting.");
  }
  if (!answers.positiveFeedback.trim() || !answers.constructiveFeedback.trim()) {
    throw new Error(
      "Describe what the intern was doing well and what they could be doing even better.",
    );
  }
  if (questions.some((question) => !answers.customAnswers[question.id]?.trim())) {
    throw new Error("Answer every additional question before submitting.");
  }
}

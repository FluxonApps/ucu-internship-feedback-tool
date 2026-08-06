import "server-only";

import { z } from "zod";

import {
  auditFieldsSchema,
  firestoreTimestampSchema,
  teammateResponsibilitySchema,
} from "@/server/shared/models";

export const customFeedbackQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
});

export const feedbackCycleDocumentSchema = auditFieldsSchema.extend({
  evaluationStartsAt: firestoreTimestampSchema,
  evaluationEndsAt: firestoreTimestampSchema,
  dueAt: firestoreTimestampSchema.optional(),
  questionnaireVersion: z.number().int().positive(),
  customQuestions: z.array(customFeedbackQuestionSchema),
  reviewerCount: z.number().int().nonnegative(),

  cancelledAt: firestoreTimestampSchema.optional(),
  cancelledBy: z.string().min(1).optional(),
  cancellationReason: z.string().optional(),

  publishedAt: firestoreTimestampSchema.optional(),
  publishedBy: z.string().min(1).optional(),
  publishedByDisplayNameSnapshot: z.string().min(1).optional(),
  managerRecommendation: z.string().optional(),
});

export type FeedbackCycleDocument = z.infer<typeof feedbackCycleDocumentSchema>;

export const feedbackReviewerDocumentSchema = auditFieldsSchema.extend({
  reviewerUserId: z.string().min(1),
  reviewerDisplayNameSnapshot: z.string().min(1),
  teammateAssignmentIds: z.array(z.string()),
  responsibilitiesSnapshot: z.array(teammateResponsibilitySchema),
  teamIdsSnapshot: z.array(z.string()),
  status: z.enum(["notStarted", "draft", "submitted"]),
  submittedAt: firestoreTimestampSchema.optional(),
  draftUpdatedAt: firestoreTimestampSchema.optional(),
});

export type FeedbackReviewerDocument = z.infer<typeof feedbackReviewerDocumentSchema>;

export const feedbackResponseDocumentSchema = auditFieldsSchema.extend({
  reviewerUserId: z.string().min(1),
  questionnaireVersion: z.number().int().positive(),
  ratings: z.record(z.string(), z.number().int().min(1).max(5)),
  positiveFeedback: z.string(),
  constructiveFeedback: z.string(),
  managerOnlyFeedback: z.string(),
  customAnswers: z.record(z.string(), z.string()),
});

export type FeedbackResponseDocument = z.infer<typeof feedbackResponseDocumentSchema>;

export const feedbackScheduleTypeSchema = z.enum(["automatic", "reminder"]);
export const feedbackScheduleStatusSchema = z.enum(["pending", "processed", "cancelled"]);

export const feedbackScheduleDocumentSchema = auditFieldsSchema.extend({
  type: feedbackScheduleTypeSchema,

  status: feedbackScheduleStatusSchema,

  triggerAt: firestoreTimestampSchema,

  cycleTemplate: z.object({
    evaluationStartsAt: firestoreTimestampSchema,
    evaluationEndsAt: firestoreTimestampSchema,
    dueAt: firestoreTimestampSchema.optional(),
    customQuestions: z.array(customFeedbackQuestionSchema),
  }),

  processedAt: firestoreTimestampSchema.optional(),

  cancelledAt: firestoreTimestampSchema.optional(),
  cancelledBy: z.string().min(1).optional(),
});

export type FeedbackScheduleDocument = z.infer<typeof feedbackScheduleDocumentSchema>;

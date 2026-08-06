import "server-only";

import { z } from "zod";

const isoDate = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));

export const createFeedbackCycleInputSchema = z.object({
  evaluationStartsAt: isoDate,
  evaluationEndsAt: isoDate,
  dueAt: isoDate.optional(),
  customQuestions: z.array(z.string().trim().min(1).max(240)).max(20),
});

export const cancelFeedbackCycleInputSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const updateFeedbackCycleInputSchema = z.object({
  dueAt: isoDate.nullable(),
});

export const publishFeedbackCycleInputSchema = z.object({
  managerRecommendation: z.string().trim().min(1).max(10_000),
});

export const feedbackAnswersInputSchema = z.object({
  ratings: z.record(z.string(), z.number().int().min(1).max(5)),
  positiveFeedback: z.string().max(10_000).default(""),
  constructiveFeedback: z.string().max(10_000).default(""),
  managerOnlyFeedback: z.string().max(10_000).default(""),
  customAnswers: z.record(z.string(), z.string().max(10_000)),
});

export type FeedbackAnswersInput = z.infer<typeof feedbackAnswersInputSchema>;

export const createFeedbackScheduleInputSchema = z.object({
  type: z.enum(["automatic", "reminder"]),
  triggerAt: z.coerce.date(),
  cycleTemplate: z.object({
    evaluationStartsAt: z.coerce.date(),
    evaluationEndsAt: z.coerce.date(),
    dueAt: z.coerce.date().optional(),
    customQuestions: z.array(
      z.object({
        id: z.string().min(1),
        prompt: z.string().min(1),
      })
    ),
  }),
});

export type CreateFeedbackScheduleInput = z.infer<typeof createFeedbackScheduleInputSchema>;

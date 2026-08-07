import "server-only";

import { z } from "zod";

export const createCasualFeedbackNoteInputSchema = z.object({
  date: z
    .string()
    .datetime({ offset: true })
    .transform((value) => new Date(value)),
  text: z.string().trim().min(1).max(5_000),
});

export type CreateCasualFeedbackNoteInput = z.infer<
  typeof createCasualFeedbackNoteInputSchema
>;

import "server-only";

import { z } from "zod";

import {
  auditFieldsSchema,
  firestoreTimestampSchema,
  teammateResponsibilitySchema,
} from "@/server/shared/models";

export const internshipStatusSchema = z.enum(["active", "completed", "archived"]);

export const internshipDocumentSchema = auditFieldsSchema.extend({
  internId: z.string().min(1),
  status: internshipStatusSchema,
  startsAt: firestoreTimestampSchema,
  endsAt: firestoreTimestampSchema.optional(),
  publishedFeedbackCycleCount: z.number().int().nonnegative().optional(),
  latestFeedbackPublishedAt: firestoreTimestampSchema.optional(),
});

export type InternshipDocument = z.infer<typeof internshipDocumentSchema>;

export const teamDocumentSchema = auditFieldsSchema.extend({
  title: z.string().trim().min(1).max(120),
});

export type TeamDocument = z.infer<typeof teamDocumentSchema>;

export const managerAssignmentDocumentSchema = auditFieldsSchema.extend({
  userId: z.string().min(1),
});

export type ManagerAssignmentDocument = z.infer<typeof managerAssignmentDocumentSchema>;

const datedAssignmentDocumentSchema = auditFieldsSchema.extend({
  startsAt: firestoreTimestampSchema,
  endsAt: firestoreTimestampSchema.optional(),
});

export const teamPlacementDocumentSchema = datedAssignmentDocumentSchema.extend({
  teamId: z.string().min(1),
});

export type TeamPlacementDocument = z.infer<typeof teamPlacementDocumentSchema>;

export const teammateAssignmentDocumentSchema = datedAssignmentDocumentSchema.extend({
  teammateUserId: z.string().min(1),
  teamId: z.string().min(1),
  responsibilities: z.array(teammateResponsibilitySchema),
});

export type TeammateAssignmentDocument = z.infer<
  typeof teammateAssignmentDocumentSchema
>;

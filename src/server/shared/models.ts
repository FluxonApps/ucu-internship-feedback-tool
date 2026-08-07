import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { teammateResponsibilities } from "@/lib/teammate-responsibilities";

export const firestoreTimestampSchema = z.instanceof(Timestamp);

export const auditFieldsSchema = z.object({
  createdAt: firestoreTimestampSchema,
  createdBy: z.string().min(1),
  updatedAt: firestoreTimestampSchema,
  updatedBy: z.string().min(1),
});

export const teammateResponsibilitySchema = z.enum(
  teammateResponsibilities.map(({ value }) => value) as [
    (typeof teammateResponsibilities)[number]["value"],
    ...(typeof teammateResponsibilities)[number]["value"][],
  ],
);

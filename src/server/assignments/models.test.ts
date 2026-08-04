import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import { internshipDocumentSchema, teammateAssignmentDocumentSchema } from "./models";

const auditFields = {
  createdAt: Timestamp.now(),
  createdBy: "manager-id",
  updatedAt: Timestamp.now(),
  updatedBy: "manager-id",
};

describe("assignment Firestore models", () => {
  it("accepts a persisted internship document", () => {
    expect(
      internshipDocumentSchema.parse({
        ...auditFields,
        internId: "intern-id",
        status: "active",
        startsAt: Timestamp.now(),
      }).internId,
    ).toBe("intern-id");
  });

  it("rejects an unknown teammate responsibility", () => {
    expect(() =>
      teammateAssignmentDocumentSchema.parse({
        ...auditFields,
        teammateUserId: "teammate-id",
        teamId: "team-id",
        startsAt: Timestamp.now(),
        responsibilities: ["manager"],
      }),
    ).toThrow();
  });
});

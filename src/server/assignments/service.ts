import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentReference,
} from "firebase-admin/firestore";
import { z } from "zod";

import { AuthorizationError } from "@/server/authorization/errors";
import type { ApplicationUserOption, TeamOption } from "@/lib/assignments/types";
import {
  assignmentStatus,
  assertValidRange,
  containsRange,
  isCurrent,
  isOngoingOrScheduled,
  rangesOverlap,
  type DateRange,
} from "@/server/assignments/domain";
import { adminFirestore } from "@/server/firebase/admin";
import { appUserSchema, type AppUser } from "@/server/users/app-user";
import {
  teammateResponsibilities,
  type TeammateResponsibility,
} from "@/lib/teammate-responsibilities";

export const responsibilitySchema = z.enum(
  teammateResponsibilities.map(({ value }) => value) as [
    TeammateResponsibility,
    ...TeammateResponsibility[],
  ],
);

export const teamInputSchema = z.union([
  z.object({ teamId: z.string().min(1), newTeamName: z.never().optional() }),
  z.object({
    teamId: z.never().optional(),
    newTeamName: z.string().trim().min(1).max(120),
  }),
]);

const dateSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => Timestamp.fromDate(new Date(value)));

export const createInternshipInputSchema = z.object({
  internId: z.string().min(1),
  team: teamInputSchema,
  startsAt: dateSchema,
});

export const createPlacementInputSchema = z.object({
  team: teamInputSchema,
  startsAt: dateSchema,
  endsAt: dateSchema.optional(),
});

export const createTeammateAssignmentInputSchema = z.object({
  teammateUserId: z.string().min(1),
  teamId: z.string().min(1),
  responsibilities: z
    .array(responsibilitySchema)
    .max(3)
    .refine(
      (values) => new Set(values).size === values.length,
      "Responsibilities must be unique.",
    ),
  startsAt: dateSchema,
  endsAt: dateSchema.optional(),
});

export const updateResponsibilitiesInputSchema = z.object({
  responsibilities: z
    .array(responsibilitySchema)
    .max(3)
    .refine(
      (values) => new Set(values).size === values.length,
      "Responsibilities must be unique.",
    ),
});

type TeamInput = z.infer<typeof teamInputSchema>;
async function requireManagedInternship(internshipId: string, managerId: string) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const [internship, managerAssignment] = await Promise.all([
    internshipRef.get(),
    internshipRef.collection("managerAssignments").doc(managerId).get(),
  ]);

  if (!internship.exists || !managerAssignment.exists) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "You do not manage this internship.",
      "manager",
    );
  }

  return internshipRef;
}

async function requireTeammateInternship(internshipId: string, teammateUserId: string) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const [internship, assignments] = await Promise.all([
    internshipRef.get(),
    internshipRef
      .collection("teammateAssignments")
      .where("teammateUserId", "==", teammateUserId)
      .limit(1)
      .get(),
  ]);

  if (!internship.exists || assignments.empty) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "You are not assigned to this internship.",
      "teammate",
    );
  }

  return internshipRef;
}

async function resolveTeam(
  transaction: FirebaseFirestore.Transaction,
  input: TeamInput,
  actorId: string,
): Promise<DocumentReference> {
  if ("teamId" in input && input.teamId) {
    const teamRef = adminFirestore.collection("teams").doc(input.teamId);
    const team = await transaction.get(teamRef);
    if (!team.exists) {
      throw new Error("The selected Team no longer exists.");
    }
    return teamRef;
  }

  const teamRef = adminFirestore.collection("teams").doc();
  transaction.create(teamRef, {
    title: input.newTeamName,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actorId,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorId,
  });
  return teamRef;
}

async function getEligibleUser(
  userId: string,
  role: "intern" | "teammate",
): Promise<AppUser> {
  const user = await adminFirestore.collection("users").doc(userId).get();
  if (!user.exists) throw new Error("The selected user no longer exists.");
  const data = appUserSchema.parse(user.data());
  if (!data.active || !data.roles.includes(role)) {
    throw new Error("The selected user is not eligible for this assignment.");
  }
  return data;
}

export async function listManagedInternships(managerId: string) {
  const assignments = await adminFirestore
    .collectionGroup("managerAssignments")
    .where("userId", "==", managerId)
    .get();

  const results = await Promise.all(
    assignments.docs.map(async (assignment) => {
      const internship = await assignment.ref.parent.parent?.get();
      if (!internship?.exists) return undefined;
      const data = internship.data() as { internId: string; status: string };
      const intern = await adminFirestore.collection("users").doc(data.internId).get();
      return {
        id: internship.id,
        status: data.status,
        internName: intern.exists
          ? (intern.data()?.displayName as string)
          : "Unknown intern",
      };
    }),
  );

  return results.filter((result): result is NonNullable<typeof result> =>
    Boolean(result),
  );
}

export async function listTeammateInternships(teammateUserId: string) {
  const assignments = await adminFirestore
    .collectionGroup("teammateAssignments")
    .where("teammateUserId", "==", teammateUserId)
    .get();
  const internshipRefs = new Map(
    assignments.docs.flatMap((assignment) => {
      const internshipRef = assignment.ref.parent.parent;
      return internshipRef ? [[internshipRef.id, internshipRef] as const] : [];
    }),
  );
  const results = await Promise.all(
    [...internshipRefs.values()].map(async (internshipRef) => {
      const internship = await internshipRef.get();
      if (!internship.exists) return undefined;
      const data = internship.data() as { internId: string; status: string };
      const intern = await adminFirestore.collection("users").doc(data.internId).get();
      return {
        id: internship.id,
        status: data.status,
        internName: intern.exists
          ? (intern.data()?.displayName as string)
          : "Unknown intern",
      };
    }),
  );

  return results
    .filter((result): result is NonNullable<typeof result> => Boolean(result))
    .sort((a, b) => a.internName.localeCompare(b.internName));
}

export async function getCurrentInternshipForIntern(internId: string) {
  const now = Timestamp.now();
  const internships = await adminFirestore
    .collection("internships")
    .where("internId", "==", internId)
    .get();
  const current = internships.docs
    .map((document) => ({
      id: document.id,
      ...(document.data() as DateRange & { status: string }),
    }))
    .filter(
      (internship) => internship.status === "active" && isCurrent(internship, now),
    )
    .sort((a, b) => b.startsAt.toMillis() - a.startsAt.toMillis())[0];

  return current ? { id: current.id } : undefined;
}

export async function listEligibleUsers(
  role: "intern" | "teammate",
): Promise<ApplicationUserOption[]> {
  const snapshot = await adminFirestore
    .collection("users")
    .where("active", "==", true)
    .where("roles", "array-contains", role)
    .get();
  return snapshot.docs.map((document) => {
    const data = appUserSchema.parse(document.data());
    return {
      id: document.id,
      displayName: data.displayName,
      email: data.email,
      identityState: data.identityState,
    };
  });
}

async function listUnavailableInternIds(): Promise<Set<string>> {
  const now = Timestamp.now();
  const internships = await adminFirestore.collection("internships").get();

  return new Set(
    internships.docs.flatMap((document) => {
      const data = document.data() as DateRange & {
        internId: string;
        status: string;
      };
      return data.status === "active" && isOngoingOrScheduled(data, now)
        ? [data.internId]
        : [];
    }),
  );
}

async function hasOngoingOrScheduledInternship(internId: string): Promise<boolean> {
  return (await listUnavailableInternIds()).has(internId);
}

export async function listAvailableInterns(): Promise<ApplicationUserOption[]> {
  const [interns, unavailableInternIds] = await Promise.all([
    listEligibleUsers("intern"),
    listUnavailableInternIds(),
  ]);

  return interns.filter((intern) => !unavailableInternIds.has(intern.id));
}

export async function getManagedInternshipDetail(
  internshipId: string,
  managerId: string,
) {
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const [internship, placements, assignments, teammates] = await Promise.all([
    internshipRef.get(),
    internshipRef.collection("teamPlacements").orderBy("startsAt", "desc").get(),
    internshipRef.collection("teammateAssignments").orderBy("startsAt", "desc").get(),
    listEligibleUsers("teammate"),
  ]);
  const internshipData = internship.data() as { internId: string; status: string };
  const intern = await adminFirestore
    .collection("users")
    .doc(internshipData.internId)
    .get();
  const teamIds = new Set<string>();
  placements.docs.forEach((document) => teamIds.add(document.data().teamId as string));
  assignments.docs.forEach((document) => teamIds.add(document.data().teamId as string));
  const teams = new Map(
    (
      await Promise.all(
        [...teamIds].map(async (id) => {
          const document = await adminFirestore.collection("teams").doc(id).get();
          return [id, document.data()?.title as string | undefined] as const;
        }),
      )
    ).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  const teammateIds = new Set(
    assignments.docs.map((document) => document.data().teammateUserId as string),
  );
  const teammateNames = new Map(
    await Promise.all(
      [...teammateIds].map(async (id) => {
        const document = await adminFirestore.collection("users").doc(id).get();
        return [id, document.data()?.displayName as string | undefined] as const;
      }),
    ),
  );
  return {
    internship: {
    id: internshipId,
    internId: internshipData.internId,
    status: internshipData.status,
    internName: intern.data()?.displayName as string,
  },
    placements: placements.docs.map((document) => {
      const data = document.data() as DateRange & { teamId: string };
      return {
        id: document.id,
        teamId: data.teamId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        current: isCurrent(data),
        status: assignmentStatus(data),
        teamTitle: teams.get(data.teamId) ?? "Unknown Team",
      };
    }),
    assignments: assignments.docs.map((document) => {
      const data = document.data() as DateRange & {
        teamId: string;
        teammateUserId: string;
        responsibilities: string[];
      };
      return {
        id: document.id,
        teamId: data.teamId,
        teammateUserId: data.teammateUserId,
        teammateName: teammateNames.get(data.teammateUserId) ?? "Unknown teammate",
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        current: isCurrent(data),
        status: assignmentStatus(data),
        responsibilities: data.responsibilities,
        teamTitle: teams.get(data.teamId) ?? "Unknown Team",
      };
    }),
    teammates,
  };
}

export async function getTeammateInternshipDetail(
  internshipId: string,
  teammateUserId: string,
) {
  const internshipRef = await requireTeammateInternship(internshipId, teammateUserId);
  const internship = await internshipRef.get();
  const data = internship.data() as { internId: string; status: string };
  const intern = await adminFirestore.collection("users").doc(data.internId).get();

  return {
    id: internshipId,
    status: data.status,
    internName: intern.exists
      ? (intern.data()?.displayName as string)
      : "Unknown intern",
  };
}

export async function searchTeams(query: string): Promise<TeamOption[]> {
  const snapshot = await adminFirestore
    .collection("teams")
    .orderBy("title")
    .limit(30)
    .get();
  const normalizedQuery = query.trim().toLowerCase();
  return snapshot.docs
    .map((document) => ({ id: document.id, title: document.data().title as string }))
    .filter(
      (team) => !normalizedQuery || team.title.toLowerCase().includes(normalizedQuery),
    );
}

export async function createInternship(
  managerId: string,
  input: z.infer<typeof createInternshipInputSchema>,
) {
  assertValidRange({ startsAt: input.startsAt });
  await getEligibleUser(input.internId, "intern");
  if (await hasOngoingOrScheduledInternship(input.internId)) {
    throw new Error(
      "The selected intern already has an ongoing or scheduled internship.",
    );
  }
  const internshipRef = adminFirestore.collection("internships").doc();

  await adminFirestore.runTransaction(async (transaction) => {
    const teamRef = await resolveTeam(transaction, input.team, managerId);
    transaction.create(internshipRef, {
      internId: input.internId,
      status: "active",
      startsAt: input.startsAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
    transaction.create(internshipRef.collection("managerAssignments").doc(managerId), {
      userId: managerId,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
    transaction.create(internshipRef.collection("teamPlacements").doc(), {
      teamId: teamRef.id,
      startsAt: input.startsAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
  });
  return { id: internshipRef.id };
}

export async function addTeamPlacement(
  internshipId: string,
  managerId: string,
  input: z.infer<typeof createPlacementInputSchema>,
) {
  assertValidRange(input);
  const internshipRef = await requireManagedInternship(
    internshipId,
    managerId,
  );

  await adminFirestore.runTransaction(async (transaction) => {
    const [placements, teammates] = await Promise.all([
      transaction.get(
        internshipRef.collection("teamPlacements"),
      ),
      transaction.get(
        internshipRef.collection("teammateAssignments"),
      ),
    ]);

    const existing = placements.docs.map((document) => ({
      ref: document.ref,
      ...(document.data() as DateRange & { teamId: string }),
    }));

    const overlappingPlacement = existing.some((placement) =>
      rangesOverlap(placement, input),
    );

    let ongoing:
      | (DateRange & {
          teamId: string;
          ref: FirebaseFirestore.DocumentReference;
        })
      | undefined;

    if (overlappingPlacement) {
      ongoing = existing.find(
        (placement) =>
          !placement.endsAt &&
          placement.startsAt.toMillis() < input.startsAt.toMillis(),
      );

      if (!ongoing) {
        throw new Error("Team Placements cannot overlap.");
      }
    }

    const teamRef = await resolveTeam(
      transaction,
      input.team,
      managerId,
    );

    if (ongoing) {
      const previousEnd = Timestamp.fromMillis(
        input.startsAt.toMillis() - 1,
      );

      transaction.update(ongoing.ref, {
        endsAt: previousEnd,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: managerId,
      });

      teammates.docs.forEach((document) => {
        const assignment = document.data() as DateRange & {
          teamId: string;
        };

        if (
          assignment.teamId === ongoing?.teamId &&
          !assignment.endsAt
        ) {
          transaction.update(document.ref, {
            endsAt: previousEnd,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: managerId,
          });
        }
      });
    }

    transaction.create(
      internshipRef.collection("teamPlacements").doc(),
      {
        teamId: teamRef.id,
        startsAt: input.startsAt,
        ...(input.endsAt ? { endsAt: input.endsAt } : {}),
        createdAt: FieldValue.serverTimestamp(),
        createdBy: managerId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: managerId,
      },
    );
  });
}

export async function addTeammateAssignment(
  internshipId: string,
  managerId: string,
  input: z.infer<typeof createTeammateAssignmentInputSchema>,
) {
  assertValidRange(input);
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const eligibleUser = await getEligibleUser(input.teammateUserId, "teammate");
  if (input.teammateUserId === managerId)
    throw new Error("A manager cannot be assigned as a teammate.");
  await adminFirestore.runTransaction(async (transaction) => {
    const placements = await transaction.get(
      internshipRef.collection("teamPlacements"),
    );
    const hasPlacement = placements.docs.some((document) => {
      const placement = document.data() as DateRange & { teamId: string };
      return placement.teamId === input.teamId && containsRange(placement, input);
    });
    if (!hasPlacement)
      throw new Error("The teammate assignment must fit a Team Placement.");
    const assignments = await transaction.get(
      internshipRef.collection("teammateAssignments"),
    );
    if (
      assignments.docs.some((document) => {
        const assignment = document.data() as DateRange & {
          teammateUserId: string;
          teamId: string;
        };
        return (
          assignment.teammateUserId === input.teammateUserId &&
          assignment.teamId === input.teamId &&
          rangesOverlap(assignment, input)
        );
      })
    )
      throw new Error(
        "This teammate already has an overlapping assignment for this Team.",
      );
    transaction.create(internshipRef.collection("teammateAssignments").doc(), {
      ...input,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
  });
  return { displayName: eligibleUser.displayName };
}

export async function updateTeammateResponsibilities(
  internshipId: string,
  assignmentId: string,
  managerId: string,
  responsibilities: z.infer<
    typeof updateResponsibilitiesInputSchema
  >["responsibilities"],
) {
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const assignmentRef = internshipRef
    .collection("teammateAssignments")
    .doc(assignmentId);
  const assignment = await assignmentRef.get();
  if (!assignment.exists) throw new Error("Teammate assignment not found.");
  if (assignmentStatus(assignment.data() as DateRange) === "ended")
    throw new Error("Ended assignments cannot be edited.");
  await assignmentRef.update({
    responsibilities,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: managerId,
  });
}

export async function closeTeammateAssignment(
  internshipId: string,
  assignmentId: string,
  managerId: string,
) {
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const assignmentRef = internshipRef
    .collection("teammateAssignments")
    .doc(assignmentId);
  const assignment = await assignmentRef.get();
  if (!assignment.exists) throw new Error("Teammate assignment not found.");
  if ((assignment.data() as DateRange).endsAt) return;
  await assignmentRef.update({
    endsAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: managerId,
  });
}


export async function getInternIdByInternship(
  internshipId: string,
) {
  const internship = await adminFirestore
    .collection("internships")
    .doc(internshipId)
    .get();

  if (!internship.exists) {
    return undefined;
  }

  const data = internship.data() as {
    internId: string;
  };

  return data.internId;
}

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
  internshipDocumentSchema,
  managerAssignmentDocumentSchema,
  teamDocumentSchema,
  teammateAssignmentDocumentSchema,
  teamPlacementDocumentSchema,
} from "@/server/assignments/models";

import { teammateResponsibilitySchema } from "@/server/shared/models";

import {
  assignmentStatus,
  assertValidRange,
  containsRange,
  isCurrent,
  isOngoingOrScheduled,
  rangesOverlap,
  type DateRange
} from "@/server/assignments/domain";
import { adminFirestore } from "@/server/firebase/admin";
import { appUserSchema, type AppUser } from "@/server/users/app-user";
import {
  teammateResponsibilities,
  type TeammateResponsibility,
} from "@/lib/teammate-responsibilities";
import { addNotificationToTransaction } from "@/server/notifications/service";

export const responsibilitySchema = teammateResponsibilitySchema;

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

  internshipDocumentSchema.parse(internship.data());
  managerAssignmentDocumentSchema.parse(managerAssignment.data());

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

  internshipDocumentSchema.parse(internship.data());
  teammateAssignmentDocumentSchema.parse(assignments.docs[0].data());

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
    teamDocumentSchema.parse(team.data());
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

async function getUserDisplayName(userId: string, fallback: string): Promise<string> {
  const user = await adminFirestore.collection("users").doc(userId).get();
  return user.exists ? appUserSchema.parse(user.data()).displayName : fallback;
}

function formatResponsibilities(responsibilities: string[]) {
  const labels: Record<string, string> = {
    mentor: "Mentor",
    projectManager: "Project Manager",
    teamLead: "Team Lead",
  };

  const roles = responsibilities.map(
    (role) => labels[role] ?? role,
  );

  if (roles.length === 1) {
    return roles[0];
  }

  if (roles.length === 2) {
    return `${roles[0]} and ${roles[1]}`;
  }

  return `${roles.slice(0, -1).join(", ")} and ${roles.at(-1)}`;
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
      managerAssignmentDocumentSchema.parse(assignment.data());
      const data = internshipDocumentSchema.parse(internship.data());
      return {
        id: internship.id,
        status: data.status,
        internName: await getUserDisplayName(data.internId, "Unknown intern"),
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
      teammateAssignmentDocumentSchema.parse(assignment.data());
      const internshipRef = assignment.ref.parent.parent;
      return internshipRef ? [[internshipRef.id, internshipRef] as const] : [];
    }),
  );
  const results = await Promise.all(
    [...internshipRefs.values()].map(async (internshipRef) => {
      const internship = await internshipRef.get();
      if (!internship.exists) return undefined;
      const data = internshipDocumentSchema.parse(internship.data());
      return {
        id: internship.id,
        status: data.status,
        internName: await getUserDisplayName(data.internId, "Unknown intern"),
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
      ...internshipDocumentSchema.parse(document.data()),
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
      const data = internshipDocumentSchema.parse(document.data());
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
  const internshipData = internshipDocumentSchema.parse(internship.data());
  const teamIds = new Set<string>();
  placements.docs.forEach((document) =>
    teamIds.add(teamPlacementDocumentSchema.parse(document.data()).teamId),
  );
  assignments.docs.forEach((document) =>
    teamIds.add(teammateAssignmentDocumentSchema.parse(document.data()).teamId),
  );
  const teams = new Map(
    (
      await Promise.all(
        [...teamIds].map(async (id) => {
          const document = await adminFirestore.collection("teams").doc(id).get();
          return document.exists
            ? ([id, teamDocumentSchema.parse(document.data()).title] as const)
            : ([id, undefined] as const);
        }),
      )
    ).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  const teammateIds = new Set(
    assignments.docs.map(
      (document) =>
        teammateAssignmentDocumentSchema.parse(document.data()).teammateUserId,
    ),
  );
  const teammateNames = new Map(
    await Promise.all(
      [...teammateIds].map(async (id) => {
        const document = await adminFirestore.collection("users").doc(id).get();
        return [
          id,
          document.exists
            ? appUserSchema.parse(document.data()).displayName
            : undefined,
        ] as const;
      }),
    ),
  );
  return {
    internship: {
      id: internshipId,
      internId: internshipData.internId,
      status: internshipData.status,
      internName: await getUserDisplayName(internshipData.internId, "Unknown intern"),
    },
    placements: placements.docs.map((document) => {
      const data = teamPlacementDocumentSchema.parse(document.data());
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
      const data = teammateAssignmentDocumentSchema.parse(document.data());
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
  const data = internshipDocumentSchema.parse(internship.data());
  return {
    id: internshipId,
    status: data.status,
    internName: await getUserDisplayName(data.internId, "Unknown intern"),
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
    .map((document) => ({
      id: document.id,
      title: teamDocumentSchema.parse(document.data()).title,
    }))
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
      ...teamPlacementDocumentSchema.parse(document.data()),
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
        const assignment = teammateAssignmentDocumentSchema.parse(document.data());
        if (assignment.teamId === ongoing?.teamId && !assignment.endsAt) {
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
  const internship = await internshipRef.get();
  const internId = internship.data()?.internId as string | undefined;
  const intern = internId
    ? await adminFirestore.collection("users").doc(internId).get()
    : undefined;

  const internDisplayName =
    intern?.exists && typeof intern.data()?.displayName === "string"
      ? (intern.data()?.displayName as string)
      : "the intern";
  if (input.teammateUserId === managerId)
    throw new Error("A manager cannot be assigned as a teammate.");
  await adminFirestore.runTransaction(async (transaction) => {
    const placements = await transaction.get(
      internshipRef.collection("teamPlacements"),
    );
    const hasPlacement = placements.docs.some((document) => {
      const placement = teamPlacementDocumentSchema.parse(document.data());
      return placement.teamId === input.teamId && containsRange(placement, input);
    });
    if (!hasPlacement)
      throw new Error("The teammate assignment must fit a Team Placement.");
    const assignments = await transaction.get(
      internshipRef.collection("teammateAssignments"),
    );
    if (
      assignments.docs.some((document) => {
        const assignment = teammateAssignmentDocumentSchema.parse(document.data());
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
    const assignmentRef = internshipRef
      .collection("teammateAssignments")
      .doc();
    transaction.create(assignmentRef, {
      ...input,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });

    addNotificationToTransaction(transaction, {
      recipientUserId: input.teammateUserId,
      type: "assignmentStarted",
      title: "New assignment",
      message: `You have been assigned as ${formatResponsibilities(
        input.responsibilities,
      )} for ${internDisplayName}.`,
      href: `/teammate/internships/${internshipId}`,
      internshipId,
      deduplicationKey: `assignment-started:${assignmentRef.id}:${input.teammateUserId}`,
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
  const internshipRef = await requireManagedInternship(
    internshipId,
    managerId,
  );

  const assignmentRef = internshipRef
    .collection("teammateAssignments")
    .doc(assignmentId);

  const internship = await internshipRef.get();
  const internId = internship.data()?.internId as string | undefined;

  const intern = internId
    ? await adminFirestore.collection("users").doc(internId).get()
    : undefined;

  const internDisplayName =
    intern?.exists && typeof intern.data()?.displayName === "string"
      ? (intern.data()?.displayName as string)
      : "the intern";

  const addedNotificationKey =
    `assignment-role-added:${adminFirestore
      .collection("notifications")
      .doc().id}`;

  const removedNotificationKey =
    `assignment-role-removed:${adminFirestore
      .collection("notifications")
      .doc().id}`;

  await adminFirestore.runTransaction(async (transaction) => {
    const assignment = await transaction.get(assignmentRef);

    if (!assignment.exists) {
      throw new Error("Teammate assignment not found.");
    }

    const assignmentData = teammateAssignmentDocumentSchema.parse(assignment.data());

    if (assignmentStatus(assignmentData) === "ended") {
      throw new Error("Ended assignments cannot be edited.");
    }

    const previousResponsibilities =
      assignmentData.responsibilities ?? [];

    const addedResponsibilities = responsibilities.filter(
      (responsibility) =>
        !previousResponsibilities.includes(responsibility),
    );

    const removedResponsibilities = previousResponsibilities.filter(
      (responsibility) =>
        !responsibilities.includes(responsibility),
    );

    transaction.update(assignmentRef, {
      responsibilities,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });

    if (addedResponsibilities.length > 0) {
      addNotificationToTransaction(transaction, {
        recipientUserId: assignmentData.teammateUserId,
        type: "assignmentUpdated",
        title: "Assignment updated",
        message: `You have also been assigned as ${formatResponsibilities(
          addedResponsibilities,
        )} for ${internDisplayName}.`,
        href: `/teammate/internships/${internshipId}`,
        internshipId,
        deduplicationKey: addedNotificationKey,
      });
    }
    if (removedResponsibilities.length > 0) {
      const allRolesRemoved = responsibilities.length === 0;

      addNotificationToTransaction(transaction, {
        recipientUserId: assignmentData.teammateUserId,
        type: "assignmentUpdated",
        title: "Assignment updated",
        message: allRolesRemoved
          ? `All of your roles for ${internDisplayName} have been removed.`
          : `You are no longer assigned as ${formatResponsibilities(
            removedResponsibilities,
          )} for ${internDisplayName}.`,
        href: `/teammate/internships/${internshipId}`,
        internshipId,
        deduplicationKey: removedNotificationKey,
      });
    }
  });
}

export async function closeTeammateAssignment(
  internshipId: string,
  assignmentId: string,
  managerId: string,
) {
  const internshipRef = await requireManagedInternship(
    internshipId,
    managerId,
  );

  const assignmentRef = internshipRef
    .collection("teammateAssignments")
    .doc(assignmentId);

  const internship = await internshipRef.get();
  const internId = internship.data()?.internId as string | undefined;

  const intern = internId
    ? await adminFirestore
        .collection("users")
        .doc(internId)
        .get()
    : undefined;

  const internDisplayName =
    intern?.exists &&
    typeof intern.data()?.displayName === "string"
      ? (intern.data()?.displayName as string)
      : "the intern";

  await adminFirestore.runTransaction(async (transaction) => {
    const assignment = await transaction.get(assignmentRef);

    if (!assignment.exists) {
      throw new Error("Teammate assignment not found.");
    }

    const assignmentData = teammateAssignmentDocumentSchema.parse(assignment.data());

    if (assignmentData.endsAt) {
      return;
    }

    transaction.update(assignmentRef, {
      endsAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });

    addNotificationToTransaction(transaction, {
      recipientUserId: assignmentData.teammateUserId,
      type: "assignmentEnded",
      title: "Assignment ended",
      message: `You are no longer assigned to ${internDisplayName}.`,
      href: "/teammate",
      internshipId,
      deduplicationKey:
        `assignment-ended:${assignmentId}:${assignmentData.teammateUserId}`,
    });
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

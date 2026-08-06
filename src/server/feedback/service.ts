import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { z } from "zod";

import { type FeedbackRating } from "@/lib/feedback/definitions";
import {
  buildFeedbackPublicationPreview,
  feedbackCycleState,
} from "@/lib/feedback/publication";
import type {
  FeedbackAnswersDto,
  FeedbackCycleDto,
  PublishedFeedbackDto,
  PublishedInternshipSummaryDto,
  ReviewerStatusDto,
  TeammateFeedbackDto,
} from "@/lib/feedback/types";
import type { TeammateResponsibility } from "@/lib/teammate-responsibilities";
import { isCurrent } from "@/server/assignments/domain";
import { AuthorizationError } from "@/server/authorization/errors";
import { adminFirestore } from "@/server/firebase/admin";
import {addNotificationToBatch, addNotificationToTransaction } from "@/server/notifications/service";
import { assertValidEvaluationRange, assertValidFeedbackAnswers } from "./domain";
import type { createFeedbackCycleInputSchema, FeedbackAnswersInput } from "./schemas";

type CycleData = {
  evaluationStartsAt: Timestamp;
  evaluationEndsAt: Timestamp;
  dueAt?: Timestamp;
  customQuestions: Array<{ id: string; prompt: string }>;
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  publishedAt?: Timestamp;
  publishedBy?: string;
  publishedByDisplayNameSnapshot?: string;
  managerRecommendation?: string;
};

type ReviewerData = {
  reviewerUserId: string;
  reviewerDisplayNameSnapshot: string;
  responsibilitiesSnapshot?: TeammateResponsibility[];
  status: "notStarted" | "draft" | "submitted";
  submittedAt?: Timestamp;
};

type ResponseData = FeedbackAnswersDto;

async function requireManagedInternship(internshipId: string, managerId: string) {
  const ref = adminFirestore.collection("internships").doc(internshipId);
  const [internship, assignment] = await Promise.all([
    ref.get(),
    ref.collection("managerAssignments").doc(managerId).get(),
  ]);
  if (!internship.exists || !assignment.exists) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "You do not manage this internship.",
      "manager",
    );
  }
  return ref;
}

function answersDto(data: Partial<ResponseData> | undefined): FeedbackAnswersDto {
  return {
    ratings: data?.ratings ?? {},
    positiveFeedback: data?.positiveFeedback ?? "",
    constructiveFeedback: data?.constructiveFeedback ?? "",
    managerOnlyFeedback: data?.managerOnlyFeedback ?? "",
    customAnswers: data?.customAnswers ?? {},
  };
}

async function cycleDto(
  cycle: FirebaseFirestore.QueryDocumentSnapshot,
  includeSubmittedResponses: boolean,
): Promise<FeedbackCycleDto> {
  const data = cycle.data() as CycleData;
  const reviewers = await cycle.ref.collection("reviewers").get();
  const reviewerDtos = await Promise.all(
    reviewers.docs.map(async (document): Promise<ReviewerStatusDto> => {
      const reviewer = document.data() as ReviewerData;
      let response: FeedbackAnswersDto | undefined;
      if (includeSubmittedResponses && reviewer.status === "submitted") {
        const stored = await cycle.ref.collection("responses").doc(document.id).get();
        response = stored.exists
          ? answersDto(stored.data() as ResponseData)
          : undefined;
      }
      return {
        reviewerUserId: document.id,
        reviewerDisplayName: reviewer.reviewerDisplayNameSnapshot,
        responsibilities: reviewer.responsibilitiesSnapshot ?? [],
        status: reviewer.status,
        submittedAt: reviewer.submittedAt?.toDate().toISOString(),
        response,
      };
    }),
  );
  const reviewerValues = reviewerDtos.sort((a, b) =>
    a.reviewerDisplayName.localeCompare(b.reviewerDisplayName),
  );
  return {
    id: cycle.id,
    evaluationStartsAt: data.evaluationStartsAt.toDate().toISOString(),
    evaluationEndsAt: data.evaluationEndsAt.toDate().toISOString(),
    dueAt: data.dueAt?.toDate().toISOString(),
    cancelledAt: data.cancelledAt?.toDate().toISOString(),
    cancellationReason: data.cancellationReason,
    publishedAt: data.publishedAt?.toDate().toISOString(),
    publishedByDisplayName: data.publishedByDisplayNameSnapshot,
    managerRecommendation: data.managerRecommendation,
    state: feedbackCycleState(data),
    customQuestions: data.customQuestions,
    reviewers: reviewerValues,
    publicationPreview: buildFeedbackPublicationPreview(
      reviewerValues,
      data.customQuestions,
    ),
  };
}

export async function listManagerFeedbackCycles(
  internshipId: string,
  managerId: string,
): Promise<FeedbackCycleDto[]> {
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const cycles = await internshipRef.collection("feedbackCycles").get();
  const result = await Promise.all(cycles.docs.map((cycle) => cycleDto(cycle, true)));
  return result.sort((a, b) =>
    b.evaluationStartsAt.localeCompare(a.evaluationStartsAt),
  );
}

async function publishedFeedbackDto(
  internshipId: string,
  internId: string,
  internDisplayName: string,
  cycle: FirebaseFirestore.QueryDocumentSnapshot,
): Promise<PublishedFeedbackDto> {
  const data = cycle.data() as CycleData;
  if (
    feedbackCycleState(data) !== "published" ||
    !data.publishedAt ||
    !data.publishedBy ||
    !data.publishedByDisplayNameSnapshot ||
    !data.managerRecommendation
  ) {
    throw new Error("Published feedback metadata is incomplete.");
  }
  const managerCycle = await cycleDto(cycle, true);
  return {
    internshipId,
    internId,
    internDisplayName,
    cycleId: cycle.id,
    evaluationStartsAt: managerCycle.evaluationStartsAt,
    evaluationEndsAt: managerCycle.evaluationEndsAt,
    publishedAt: data.publishedAt.toDate().toISOString(),
    publishedByDisplayName: data.publishedByDisplayNameSnapshot,
    managerRecommendation: data.managerRecommendation,
    ...managerCycle.publicationPreview,
  };
}

async function listPublishedFeedbackForInternship(
  internshipRef: FirebaseFirestore.DocumentReference,
): Promise<PublishedFeedbackDto[]> {
  const internship = await internshipRef.get();
  if (!internship.exists) return [];
  const internshipData = internship.data() as { internId: string };
  const intern = await adminFirestore
    .collection("users")
    .doc(internshipData.internId)
    .get();
  const internDisplayName = intern.exists
    ? (intern.data()?.displayName as string)
    : "Unknown intern";
  const cycles = await internshipRef.collection("feedbackCycles").get();
  const published = cycles.docs.filter(
    (cycle) => feedbackCycleState(cycle.data()) === "published",
  );
  const result = await Promise.all(
    published.map((cycle) =>
      publishedFeedbackDto(
        internshipRef.id,
        internshipData.internId,
        internDisplayName,
        cycle,
      ),
    ),
  );
  return result.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function listInternPublishedFeedback(
  internshipId: string,
  internId: string,
): Promise<PublishedFeedbackDto[]> {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const internship = await internshipRef.get();
  if (!internship.exists) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "You cannot view this internship's feedback.",
      "intern",
    );
  }
  return listPublishedFeedbackForInternship(internshipRef);
}

export async function listGuestPublishedInternships(): Promise<
  PublishedInternshipSummaryDto[]
> {
  const internships = await adminFirestore
    .collection("internships")
    .where("publishedFeedbackCycleCount", ">", 0)
    .get();
  const values = await Promise.all(
    internships.docs.map(async (internship) => {
      const data = internship.data() as {
        internId: string;
        latestFeedbackPublishedAt: Timestamp;
        publishedFeedbackCycleCount: number;
      };
      const intern = await adminFirestore.collection("users").doc(data.internId).get();
      if (!data.latestFeedbackPublishedAt) return undefined;
      return {
        internshipId: internship.id,
        internDisplayName: intern.exists
          ? (intern.data()?.displayName as string)
          : "Unknown intern",
        latestPublishedAt: data.latestFeedbackPublishedAt.toDate().toISOString(),
        publishedCycleCount: data.publishedFeedbackCycleCount,
      } satisfies PublishedInternshipSummaryDto;
    }),
  );
  return values
    .filter((value): value is PublishedInternshipSummaryDto => Boolean(value))
    .sort((a, b) => b.latestPublishedAt.localeCompare(a.latestPublishedAt));
}

export async function listGuestPublishedFeedback(
  internshipId: string,
): Promise<PublishedFeedbackDto[]> {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const internship = await internshipRef.get();
  if (
    !internship.exists ||
    !(Number(internship.data()?.publishedFeedbackCycleCount) > 0)
  ) {
    throw new Error("Published internship feedback was not found.");
  }
  return listPublishedFeedbackForInternship(internshipRef);
}

export async function publishFeedbackCycle(
  internshipId: string,
  cycleId: string,
  managerId: string,
  recommendation: string,
) {
  const managerRecommendation = recommendation.trim();
  if (!managerRecommendation) throw new Error("Manager recommendation is required.");
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const [manager, reviewers] = await Promise.all([
    adminFirestore.collection("users").doc(managerId).get(),
    internshipRef
      .collection("feedbackCycles")
      .doc(cycleId)
      .collection("reviewers")
      .get(),
  ]);
  const managerDisplayName = manager.exists
    ? (manager.data()?.displayName as string)
    : "Unknown manager";
  const cycleRef = internshipRef.collection("feedbackCycles").doc(cycleId);
  const managerAssignmentRef = internshipRef
    .collection("managerAssignments")
    .doc(managerId);
  const reviewerRefs = reviewers.docs.map((reviewer) => reviewer.ref);

  await adminFirestore.runTransaction(async (transaction) => {
    const documents = await transaction.getAll(
      internshipRef,
      cycleRef,
      managerAssignmentRef,
      ...reviewerRefs,
    );
    const internship = documents[0];
    const cycle = documents[1];
    const managerAssignment = documents[2];
    if (!internship.exists || !managerAssignment.exists) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "You do not manage this internship.",
        "manager",
      );
    }
    if (
      !cycle.exists ||
      feedbackCycleState(cycle.data() as CycleData) !== "collecting"
    ) {
      throw new Error("Only a collecting cycle can be published.");
    }

    const now = Timestamp.now();
    const internshipData = internship.data() as {
      publishedFeedbackCycleCount?: number;
    };
    transaction.update(cycleRef, {
      publishedAt: now,
      publishedBy: managerId,
      publishedByDisplayNameSnapshot: managerDisplayName,
      managerRecommendation,
      updatedAt: now,
      updatedBy: managerId,
    });
    transaction.update(internshipRef, {
      publishedFeedbackCycleCount:
        (internshipData.publishedFeedbackCycleCount ?? 0) + 1,
      latestFeedbackPublishedAt: now,
      updatedAt: now,
      updatedBy: managerId,
    });

    const internId = internship.data()?.internId as string | undefined;

    if (!internId) {
      throw new Error("The internship does not have an assigned intern.");
    }

    addNotificationToTransaction(transaction, {
      recipientUserId: internId,
      type: "feedbackPublished",
      title: "New feedback published",
      message: "Your feedback results are now available.",
      href: `/intern/internships/${internshipId}`,
      internshipId,
      feedbackCycleId: cycleId,
      deduplicationKey: `feedback-published:${cycleId}:${internId}`,
    });
  });
}

export async function startFeedbackCycle(
  internshipId: string,
  managerId: string,
  input: z.infer<typeof createFeedbackCycleInputSchema>,
) {
  assertValidEvaluationRange(input.evaluationStartsAt, input.evaluationEndsAt);
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const existing = await internshipRef.collection("feedbackCycles").get();
  if (
    existing.docs.some((cycle) => feedbackCycleState(cycle.data()) === "collecting")
  ) {
    throw new Error("A collecting feedback cycle already exists.");
  }

  const now = Timestamp.now();
  const [assignments, internship] = await Promise.all([
    internshipRef.collection("teammateAssignments").get(),
    internshipRef.get(),
  ]);

  const internId = internship.data()?.internId as string | undefined;

  const intern = internId
    ? await adminFirestore.collection("users").doc(internId).get()
    : undefined;

  const internDisplayName =
    intern?.exists && typeof intern.data()?.displayName === "string"
      ? (intern.data()?.displayName as string)
      : "the intern";

  const current = assignments.docs.filter((document) => {
    const data = document.data() as { startsAt: Timestamp; endsAt?: Timestamp };
    return isCurrent(data, now);
  });
  const snapshots = new Map<
    string,
    { assignmentIds: string[]; responsibilities: Set<string>; teamIds: Set<string> }
  >();
  current.forEach((document) => {
    const data = document.data() as {
      teammateUserId: string;
      responsibilities: string[];
      teamId: string;
    };
    const value = snapshots.get(data.teammateUserId) ?? {
      assignmentIds: [],
      responsibilities: new Set<string>(),
      teamIds: new Set<string>(),
    };
    value.assignmentIds.push(document.id);
    data.responsibilities.forEach((item) => value.responsibilities.add(item));
    value.teamIds.add(data.teamId);
    snapshots.set(data.teammateUserId, value);
  });
  if (!snapshots.size) throw new Error("There are no current teammates to review.");

  const names = new Map(
    await Promise.all(
      [...snapshots.keys()].map(async (userId) => {
        const user = await adminFirestore.collection("users").doc(userId).get();
        return [
          userId,
          (user.data()?.displayName as string) ?? "Unknown teammate",
        ] as const;
      }),
    ),
  );
  const cycleRef = internshipRef.collection("feedbackCycles").doc();
  const batch = adminFirestore.batch();
  batch.create(cycleRef, {
    evaluationStartsAt: Timestamp.fromDate(input.evaluationStartsAt),
    evaluationEndsAt: Timestamp.fromDate(input.evaluationEndsAt),
    ...(input.dueAt ? { dueAt: Timestamp.fromDate(input.dueAt) } : {}),
    questionnaireVersion: 1,
    customQuestions: input.customQuestions.map((prompt, index) => ({
      id: `question-${index + 1}`,
      prompt,
    })),
    reviewerCount: snapshots.size,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: managerId,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: managerId,
  });
  snapshots.forEach((snapshot, reviewerUserId) => {
    batch.create(cycleRef.collection("reviewers").doc(reviewerUserId), {
      reviewerUserId,
      reviewerDisplayNameSnapshot: names.get(reviewerUserId),
      teammateAssignmentIds: snapshot.assignmentIds,
      responsibilitiesSnapshot: [...snapshot.responsibilities],
      teamIdsSnapshot: [...snapshot.teamIds],
      status: "notStarted",
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
    addNotificationToBatch(batch, {
      recipientUserId: reviewerUserId,
      type: "feedbackCycleStarted",
      title: "New feedback request",
      message: `Feedback for ${internDisplayName} is now available.`,
      href: `/teammate/internships/${internshipId}`,
      internshipId,
      feedbackCycleId: cycleRef.id,
      deduplicationKey: `feedback-cycle-started:${cycleRef.id}:${reviewerUserId}`,
    });
  });
  await batch.commit();
  return { id: cycleRef.id };
}

export async function updateFeedbackCycleDueDate(
  internshipId: string,
  cycleId: string,
  managerId: string,
  dueAt: Date | null,
) {
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const cycleRef = internshipRef.collection("feedbackCycles").doc(cycleId);
  await adminFirestore.runTransaction(async (transaction) => {
    const cycle = await transaction.get(cycleRef);
    if (
      !cycle.exists ||
      feedbackCycleState(cycle.data() as CycleData) !== "collecting"
    ) {
      throw new Error("Only a collecting cycle can be updated.");
    }
    transaction.update(cycleRef, {
      dueAt: dueAt ? Timestamp.fromDate(dueAt) : FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
  });
}

export async function cancelFeedbackCycle(
  internshipId: string,
  cycleId: string,
  managerId: string,
  reason?: string,
) {
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const cycleRef = internshipRef.collection("feedbackCycles").doc(cycleId);
  await adminFirestore.runTransaction(async (transaction) => {
    const cycle = await transaction.get(cycleRef);
    if (
      !cycle.exists ||
      feedbackCycleState(cycle.data() as CycleData) !== "collecting"
    ) {
      throw new Error("Only a collecting cycle can be cancelled.");
    }
    transaction.update(cycleRef, {
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: managerId,
      ...(reason ? { cancellationReason: reason } : {}),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
  });
}

async function writeOwnResponse(
  internshipId: string,
  cycleId: string,
  reviewerUserId: string,
  answers: FeedbackAnswersInput,
  submit: boolean,
) {
  const normalizedRatings = Object.fromEntries(
    Object.entries(answers.ratings).map(([key, value]) => [
      key,
      value as FeedbackRating,
    ]),
  );
  const internshipRef = adminFirestore
    .collection("internships")
    .doc(internshipId);

  const cycleRef = internshipRef
    .collection("feedbackCycles")
    .doc(cycleId);
  const reviewerRef = cycleRef.collection("reviewers").doc(reviewerUserId);
  const responseRef = cycleRef.collection("responses").doc(reviewerUserId);

  const managerAssignments = submit
    ? await internshipRef.collection("managerAssignments").get()
    : undefined;

  await adminFirestore.runTransaction(async (transaction) => {
    const [cycle, reviewer, response] = await Promise.all([
      transaction.get(cycleRef),
      transaction.get(reviewerRef),
      transaction.get(responseRef),
    ]);
    if (!cycle.exists || !reviewer.exists) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "You are not a reviewer for this feedback cycle.",
        "teammate",
      );
    }
    const cycleData = cycle.data() as CycleData;
    const reviewerData = reviewer.data() as ReviewerData;
    if (feedbackCycleState(cycleData) !== "collecting") {
      throw new Error("This feedback cycle is no longer collecting responses.");
    }
    if (reviewerData.status === "submitted") {
      throw new Error("Submitted feedback cannot be changed.");
    }
    assertValidFeedbackAnswers(answers, cycleData.customQuestions, submit);

    transaction.set(
      responseRef,
      {
        reviewerUserId,
        questionnaireVersion: 1,
        ratings: normalizedRatings,
        positiveFeedback: answers.positiveFeedback,
        constructiveFeedback: answers.constructiveFeedback,
        managerOnlyFeedback: answers.managerOnlyFeedback,
        customAnswers: answers.customAnswers,
        ...(!response.exists
          ? {
              createdAt: FieldValue.serverTimestamp(),
              createdBy: reviewerUserId,
            }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: reviewerUserId,
      },
      { merge: true },
    );
    transaction.update(reviewerRef, {
      status: submit ? "submitted" : "draft",
      ...(submit
        ? { submittedAt: FieldValue.serverTimestamp() }
        : { draftUpdatedAt: FieldValue.serverTimestamp() }),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: reviewerUserId,
    });
    if (submit && managerAssignments) {
      managerAssignments.docs.forEach((managerAssignment) => {
        addNotificationToTransaction(transaction, {
          recipientUserId: managerAssignment.id,
          type: "feedbackSubmitted",
          title: "Feedback submitted",
          message: `${reviewerData.reviewerDisplayNameSnapshot} submitted feedback.`,
          href: `/manager/internships/${internshipId}#feedback-cycles`,
          internshipId,
          feedbackCycleId: cycleId,
          deduplicationKey: `feedback-submitted:${cycleId}:${reviewerUserId}:${managerAssignment.id}`,
        });
      });
    }
  });
}

export function saveFeedbackDraft(
  internshipId: string,
  cycleId: string,
  reviewerUserId: string,
  answers: FeedbackAnswersInput,
) {
  return writeOwnResponse(internshipId, cycleId, reviewerUserId, answers, false);
}

export function submitFeedback(
  internshipId: string,
  cycleId: string,
  reviewerUserId: string,
  answers: FeedbackAnswersInput,
) {
  return writeOwnResponse(internshipId, cycleId, reviewerUserId, answers, true);
}

export async function listTeammateFeedback(
  internshipId: string,
  reviewerUserId: string,
): Promise<TeammateFeedbackDto[]> {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const cycles = await internshipRef.collection("feedbackCycles").get();
  const results = await Promise.all(
    cycles.docs.map(async (cycle): Promise<TeammateFeedbackDto | undefined> => {
      const cycleData = cycle.data() as CycleData;
      if (cycleData.cancelledAt) return undefined;
      const reviewer = await cycle.ref
        .collection("reviewers")
        .doc(reviewerUserId)
        .get();
      if (!reviewer.exists) return undefined;
      const reviewerData = reviewer.data() as ReviewerData;
      const response = await cycle.ref
        .collection("responses")
        .doc(reviewerUserId)
        .get();
      const cycleValue = await cycleDto(cycle, false);
      const ownReviewer: ReviewerStatusDto = {
        reviewerUserId,
        reviewerDisplayName: reviewerData.reviewerDisplayNameSnapshot,
        responsibilities: reviewerData.responsibilitiesSnapshot ?? [],
        status: reviewerData.status,
        submittedAt: reviewerData.submittedAt?.toDate().toISOString(),
        response: response.exists
          ? answersDto(response.data() as ResponseData)
          : answersDto(undefined),
      };
      return {
        cycle: {
          ...cycleValue,
          publishedByDisplayName: undefined,
          managerRecommendation: undefined,
          reviewers: [ownReviewer],
          publicationPreview: buildFeedbackPublicationPreview(
            [ownReviewer],
            cycleValue.customQuestions,
          ),
        },
        reviewer: ownReviewer,
      };
    }),
  );
  return results
    .filter((item): item is TeammateFeedbackDto => Boolean(item))
    .sort((a, b) =>
      b.cycle.evaluationStartsAt.localeCompare(a.cycle.evaluationStartsAt),
    );
}

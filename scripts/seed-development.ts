import nextEnvironment from "@next/env";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

nextEnvironment.loadEnvConfig(process.cwd());

const projectId = process.env.FIREBASE_PROJECT_ID;
const authenticationMode = process.env.FIREBASE_AUTHENTICATION_MODE;

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID is required to seed development data.");
}

if (authenticationMode !== "email-password-development") {
  throw new Error(
    "Seeding is allowed only when FIREBASE_AUTHENTICATION_MODE=email-password-development.",
  );
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
const auth = getAuth(app);
const firestore = getFirestore(app);
const developmentPassword = "local-only-password";

const personas = [
  {
    id: "manager",
    uid: "development-manager",
    email: "manager@example.com",
    displayName: "Maya Manager",
    roles: ["manager"],
  },
  {
    id: "mentor",
    uid: "development-mentor",
    email: "mentor@example.com",
    displayName: "Morgan Mentor",
    roles: ["teammate"],
  },
  {
    id: "intern",
    uid: "development-intern",
    email: "intern@example.com",
    displayName: "Indira Intern",
    roles: ["intern"],
  },
  {
    id: "lead",
    uid: "development-lead",
    email: "lead@example.com",
    displayName: "Taylor Team Lead",
    roles: ["teammate"],
  },
] as const;

for (const persona of personas) {
  try {
    await auth.getUser(persona.uid);
    await auth.updateUser(persona.uid, {
      displayName: persona.displayName,
      email: persona.email,
      emailVerified: true,
      password: developmentPassword,
    });
  } catch {
    await auth.createUser({
      uid: persona.uid,
      displayName: persona.displayName,
      email: persona.email,
      emailVerified: true,
      password: developmentPassword,
    });
  }

  await firestore
    .collection("users")
    .doc(`development-${persona.id}`)
    .set(
      {
        active: true,
        displayName: persona.displayName,
        email: persona.email,
        identityState: "linked",
        identities: [{ provider: "firebase", subject: persona.uid }],
        roles: [...persona.roles],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

try {
  await auth.getUser("development-guest");
  await auth.updateUser("development-guest", {
    displayName: "Gina Guest",
    email: "guest@example.com",
    emailVerified: true,
    password: developmentPassword,
  });
} catch {
  await auth.createUser({
    uid: "development-guest",
    displayName: "Gina Guest",
    email: "guest@example.com",
    emailVerified: true,
    password: developmentPassword,
  });
}

console.info("Seeded manager, mentor, intern, and guest development identities.");

const internshipRef = firestore.collection("internships").doc("development-internship");
const teamRef = firestore.collection("teams").doc("development-team");
const startsAt = Timestamp.fromDate(new Date("2026-01-01T00:00:00.000Z"));

const otherDevelopmentInternships = await firestore
  .collection("internships")
  .where("internId", "==", "development-intern")
  .get();
for (const otherInternship of otherDevelopmentInternships.docs) {
  if (otherInternship.id !== internshipRef.id) {
    await otherInternship.ref.set(
      {
        status: "completed",
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "development-manager",
      },
      { merge: true },
    );
  }
}

await teamRef.set(
  {
    title: "Development Team",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-manager",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-manager",
  },
  { merge: true },
);
await internshipRef.set(
  {
    internId: "development-intern",
    status: "active",
    startsAt,
    publishedFeedbackCycleCount: 1,
    latestFeedbackPublishedAt: Timestamp.fromDate(new Date("2026-06-05T12:00:00.000Z")),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-manager",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-manager",
  },
  { merge: true },
);
await internshipRef.collection("managerAssignments").doc("development-manager").set(
  {
    userId: "development-manager",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-manager",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-manager",
  },
  { merge: true },
);
await internshipRef.collection("teamPlacements").doc("development-placement").set(
  {
    teamId: teamRef.id,
    startsAt,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-manager",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-manager",
  },
  { merge: true },
);
await internshipRef
  .collection("teammateAssignments")
  .doc("development-mentor-assignment")
  .set(
    {
      teammateUserId: "development-mentor",
      teamId: teamRef.id,
      responsibilities: ["mentor"],
      startsAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "development-manager",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "development-manager",
    },
    { merge: true },
  );
await internshipRef
  .collection("teammateAssignments")
  .doc("development-lead-assignment")
  .set(
    {
      teammateUserId: "development-lead",
      teamId: teamRef.id,
      responsibilities: ["teamLead"],
      startsAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "development-manager",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "development-manager",
    },
    { merge: true },
  );

const existingFeedbackCycles = await internshipRef.collection("feedbackCycles").get();
for (const existingCycle of existingFeedbackCycles.docs) {
  if (
    existingCycle.id !== "development-feedback-cycle" &&
    existingCycle.id !== "development-published-feedback-cycle"
  ) {
    await existingCycle.ref.set(
      {
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledBy: "development-manager",
        cancellationReason: "Retired by the deterministic development seed.",
        publishedAt: FieldValue.delete(),
        publishedBy: FieldValue.delete(),
        publishedByDisplayNameSnapshot: FieldValue.delete(),
        managerRecommendation: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "development-manager",
      },
      { merge: true },
    );
  }
}

const feedbackCycleRef = internshipRef
  .collection("feedbackCycles")
  .doc("development-feedback-cycle");
await feedbackCycleRef.set(
  {
    evaluationStartsAt: Timestamp.fromDate(new Date("2026-07-01T00:00:00.000Z")),
    evaluationEndsAt: Timestamp.fromDate(new Date("2026-07-31T00:00:00.000Z")),
    dueAt: Timestamp.fromDate(new Date("2026-08-05T00:00:00.000Z")),
    questionnaireVersion: 1,
    customQuestions: [
      {
        id: "question-1",
        prompt: "What should the intern focus on next month?",
      },
    ],
    reviewerCount: 2,
    cancelledAt: FieldValue.delete(),
    cancelledBy: FieldValue.delete(),
    cancellationReason: FieldValue.delete(),
    publishedAt: FieldValue.delete(),
    publishedBy: FieldValue.delete(),
    publishedByDisplayNameSnapshot: FieldValue.delete(),
    managerRecommendation: FieldValue.delete(),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-manager",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-manager",
  },
  { merge: true },
);
await feedbackCycleRef
  .collection("reviewers")
  .doc("development-mentor")
  .set(
    {
      reviewerUserId: "development-mentor",
      reviewerDisplayNameSnapshot: "Morgan Mentor",
      teammateAssignmentIds: ["development-mentor-assignment"],
      responsibilitiesSnapshot: ["mentor"],
      teamIdsSnapshot: [teamRef.id],
      status: "notStarted",
      draftUpdatedAt: FieldValue.delete(),
      submittedAt: FieldValue.delete(),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "development-manager",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "development-manager",
    },
    { merge: true },
  );
await feedbackCycleRef.collection("responses").doc("development-mentor").delete();

await feedbackCycleRef
  .collection("reviewers")
  .doc("development-lead")
  .set(
    {
      reviewerUserId: "development-lead",
      reviewerDisplayNameSnapshot: "Taylor Team Lead",
      teammateAssignmentIds: ["development-lead-assignment"],
      responsibilitiesSnapshot: ["teamLead"],
      teamIdsSnapshot: [teamRef.id],
      status: "submitted",
      submittedAt: Timestamp.fromDate(new Date("2026-08-01T12:00:00.000Z")),
      draftUpdatedAt: FieldValue.delete(),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "development-manager",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "development-lead",
    },
    { merge: true },
  );

const ratingsMeetingExpectations = {
  reliabilityAvailability: 4,
  communication: 4,
  teamwork: 5,
  culturalAlignment: 4,
  proactivity: 4,
  abilityToAdjustImprove: 5,
  codeQualityClarity: 4,
  independentDebuggingTesting: 3,
  codeReviewSkills: 4,
  workWithDocumentation: 4,
  systemDesignUnderstandingCuriosity: 5,
};

await feedbackCycleRef
  .collection("responses")
  .doc("development-lead")
  .set({
    reviewerUserId: "development-lead",
    questionnaireVersion: 1,
    ratings: ratingsMeetingExpectations,
    positiveFeedback: "Takes ownership and communicates progress clearly.",
    constructiveFeedback: "Could involve reviewers earlier in design decisions.",
    managerOnlyFeedback: "Offer ownership of a small cross-team improvement.",
    customAnswers: {
      "question-1": "Practice scoping work into independently deliverable steps.",
    },
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-lead",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-lead",
  });

const publishedCycleRef = internshipRef
  .collection("feedbackCycles")
  .doc("development-published-feedback-cycle");
const historicalPublishedAt = Timestamp.fromDate(new Date("2026-06-05T12:00:00.000Z"));
await publishedCycleRef.set(
  {
    evaluationStartsAt: Timestamp.fromDate(new Date("2026-05-01T00:00:00.000Z")),
    evaluationEndsAt: Timestamp.fromDate(new Date("2026-05-31T00:00:00.000Z")),
    questionnaireVersion: 1,
    customQuestions: [
      { id: "question-1", prompt: "What should the intern focus on next month?" },
    ],
    reviewerCount: 2,
    publishedAt: historicalPublishedAt,
    publishedBy: "development-manager",
    publishedByDisplayNameSnapshot: "Maya Manager",
    managerRecommendation:
      "Continue increasing ownership while keeping communication frequent and concrete.",
    cancelledAt: FieldValue.delete(),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-manager",
    updatedAt: historicalPublishedAt,
    updatedBy: "development-manager",
  },
  { merge: true },
);

for (const historicalReviewer of [
  {
    id: "development-mentor",
    name: "Morgan Mentor",
    responsibilities: ["mentor"],
    rating: 3,
  },
  {
    id: "development-lead",
    name: "Taylor Team Lead",
    responsibilities: ["teamLead"],
    rating: 4,
  },
] as const) {
  await publishedCycleRef
    .collection("reviewers")
    .doc(historicalReviewer.id)
    .set(
      {
        reviewerUserId: historicalReviewer.id,
        reviewerDisplayNameSnapshot: historicalReviewer.name,
        teammateAssignmentIds: [
          historicalReviewer.id === "development-mentor"
            ? "development-mentor-assignment"
            : "development-lead-assignment",
        ],
        responsibilitiesSnapshot: [...historicalReviewer.responsibilities],
        teamIdsSnapshot: [teamRef.id],
        status: "submitted",
        submittedAt: Timestamp.fromDate(new Date("2026-06-03T12:00:00.000Z")),
        createdAt: FieldValue.serverTimestamp(),
        createdBy: "development-manager",
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: historicalReviewer.id,
      },
      { merge: true },
    );
  await publishedCycleRef
    .collection("responses")
    .doc(historicalReviewer.id)
    .set({
      reviewerUserId: historicalReviewer.id,
      questionnaireVersion: 1,
      ratings: Object.fromEntries(
        Object.keys(ratingsMeetingExpectations).map((criterion) => [
          criterion,
          historicalReviewer.rating,
        ]),
      ),
      positiveFeedback:
        historicalReviewer.id === "development-mentor"
          ? "Responds thoughtfully to feedback and follows through."
          : "Consistently delivers reliable work for the team.",
      constructiveFeedback:
        historicalReviewer.id === "development-mentor"
          ? "Could ask clarifying questions earlier."
          : "Could document design choices more consistently.",
      managerOnlyFeedback: "Historical private development note.",
      customAnswers: {
        "question-1":
          historicalReviewer.id === "development-mentor"
            ? "Build confidence in technical planning."
            : "Lead a small feature from design through release.",
      },
      createdAt: FieldValue.serverTimestamp(),
      createdBy: historicalReviewer.id,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: historicalReviewer.id,
    });
}

console.info(
  "Seeded development internship, assignments, collecting feedback, and published history.",
);

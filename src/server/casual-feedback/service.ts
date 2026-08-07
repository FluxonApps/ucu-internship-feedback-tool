import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type { CasualFeedbackNoteDto } from "@/lib/casual-feedback/types";
import { AuthorizationError } from "@/server/authorization/errors";
import { adminFirestore } from "@/server/firebase/admin";

import { assertValidCasualFeedbackText } from "./domain";
import type { CreateCasualFeedbackNoteInput } from "./schemas";

type CasualFeedbackNoteData = {
  date: Timestamp;
  text: string;
  authorUserId: string;
  authorDisplayNameSnapshot: string;
  createdAt: Timestamp;
};

async function requireAssignedTeammateInternship(
  internshipId: string,
  teammateUserId: string,
) {
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

async function requireInternInternship(internshipId: string, internId: string) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const internship = await internshipRef.get();
  if (!internship.exists || internship.data()?.internId !== internId) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "You cannot view this internship's casual feedback.",
      "intern",
    );
  }
  return internshipRef;
}

function noteDto(
  document: FirebaseFirestore.QueryDocumentSnapshot,
): CasualFeedbackNoteDto {
  const data = document.data() as CasualFeedbackNoteData;
  return {
    id: document.id,
    date: data.date.toDate().toISOString(),
    text: data.text,
    authorUserId: data.authorUserId,
    authorDisplayName: data.authorDisplayNameSnapshot,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

async function listCasualFeedbackNotes(
  internshipRef: FirebaseFirestore.DocumentReference,
): Promise<CasualFeedbackNoteDto[]> {
  const notes = await internshipRef
    .collection("casualFeedbackNotes")
    .orderBy("date", "desc")
    .get();
  return notes.docs.map((document) => noteDto(document));
}

export async function listCasualFeedbackForTeammate(
  internshipId: string,
  teammateUserId: string,
): Promise<CasualFeedbackNoteDto[]> {
  const internshipRef = await requireAssignedTeammateInternship(
    internshipId,
    teammateUserId,
  );
  return listCasualFeedbackNotes(internshipRef);
}

export async function listCasualFeedbackForIntern(
  internshipId: string,
  internId: string,
): Promise<CasualFeedbackNoteDto[]> {
  const internshipRef = await requireInternInternship(internshipId, internId);
  return listCasualFeedbackNotes(internshipRef);
}

export async function createCasualFeedbackNote(
  internshipId: string,
  teammateUserId: string,
  input: CreateCasualFeedbackNoteInput,
) {
  assertValidCasualFeedbackText(input.text);
  const internshipRef = await requireAssignedTeammateInternship(
    internshipId,
    teammateUserId,
  );
  const author = await adminFirestore.collection("users").doc(teammateUserId).get();
  const authorDisplayName = author.exists
    ? ((author.data()?.displayName as string) ?? "Unknown teammate")
    : "Unknown teammate";
  const noteRef = internshipRef.collection("casualFeedbackNotes").doc();
  await noteRef.create({
    date: Timestamp.fromDate(input.date),
    text: input.text.trim(),
    authorUserId: teammateUserId,
    authorDisplayNameSnapshot: authorDisplayName,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: teammateUserId,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: teammateUserId,
  });
  return { id: noteRef.id };
}

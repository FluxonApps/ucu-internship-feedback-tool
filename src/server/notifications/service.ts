import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { CreateNotificationInput, NotificationDto} from "@/lib/notifications/types";
import { adminFirestore } from "@/server/firebase/admin";

function notificationData(input: CreateNotificationInput) {
  return {
    recipientUserId: input.recipientUserId,
    type: input.type,
    title: input.title,
    message: input.message,
    href: input.href,
    ...(input.internshipId
      ? { internshipId: input.internshipId }
      : {}),
    ...(input.feedbackCycleId
      ? { feedbackCycleId: input.feedbackCycleId }
      : {}),
    deduplicationKey: input.deduplicationKey,
    createdAt: FieldValue.serverTimestamp(),
    readAt: null,
  };
}

export function addNotificationToBatch(
  batch: FirebaseFirestore.WriteBatch,
  input: CreateNotificationInput,
) {
  const notificationRef = adminFirestore.collection("notifications").doc(input.deduplicationKey);

  batch.create(notificationRef, notificationData(input));

  return notificationRef;
}

export function addNotificationToTransaction(
  transaction: FirebaseFirestore.Transaction,
  input: CreateNotificationInput,
) {
  const notificationRef = adminFirestore.collection("notifications").doc(input.deduplicationKey);

  transaction.create(notificationRef, notificationData(input));

  return notificationRef;
}

type NotificationData = {
  recipientUserId: string;
  type: CreateNotificationInput["type"];
  title: string;
  message: string;
  href: string;
  internshipId?: string;
  feedbackCycleId?: string;
  deduplicationKey: string;
  createdAt: Timestamp;
  readAt: Timestamp | null;
};

export async function listNotifications(
  userId: string,
  limit = 10,
): Promise<NotificationDto[]> {
  const snapshot = await adminFirestore
    .collection("notifications")
    .where("recipientUserId", "==", userId)
    .get();

  return snapshot.docs
    .map((document) => {
      const data = document.data() as NotificationData;

      return {
        id: document.id,
        recipientUserId: data.recipientUserId,
        type: data.type,
        title: data.title,
        message: data.message,
        href: data.href,
        internshipId: data.internshipId,
        feedbackCycleId: data.feedbackCycleId,
        createdAt: data.createdAt.toDate().toISOString(),
        readAt: data.readAt?.toDate().toISOString(),
      };
    })
    .sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    )
    .slice(0, limit);
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  const notificationRef = adminFirestore
    .collection("notifications")
    .doc(notificationId);

  await adminFirestore.runTransaction(async (transaction) => {
    const notification = await transaction.get(notificationRef);

    if (!notification.exists) {
      throw new Error("Notification was not found.");
    }

    const data = notification.data() as NotificationData;

    if (data.recipientUserId !== userId) {
      throw new Error("You cannot update this notification.");
    }

    if (data.readAt) {
      return;
    }

    transaction.update(notificationRef, {
      readAt: FieldValue.serverTimestamp(),
    });
  });
}

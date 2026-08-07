export type NotificationType =
  | "feedbackCycleStarted"
  | "feedbackCycleCancelled"
  | "feedbackSubmitted"
  | "allFeedbackSubmitted"
  | "feedbackPublished"
  | "feedbackDueSoon"
  | "feedbackDueToday"
  | "feedbackOverdue"
  | "assignmentStarted"
  | "assignmentUpdated"
  | "assignmentEnded";

export type CreateNotificationInput = {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  internshipId?: string;
  feedbackCycleId?: string;
  deduplicationKey: string;
};

export type NotificationDto = {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  internshipId?: string;
  feedbackCycleId?: string;
  createdAt: string;
  readAt?: string;
};

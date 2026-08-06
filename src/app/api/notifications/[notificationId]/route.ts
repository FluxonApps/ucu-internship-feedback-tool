import { NextResponse } from "next/server";

import { AuthenticationError } from "@/server/auth/errors";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { markNotificationAsRead } from "@/server/notifications/service";

export async function PATCH(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ notificationId: string }>;
  },
) {
  try {
    const user = await requireAuthenticatedUser();
    const { notificationId } = await params;

    await markNotificationAsRead(notificationId, user.uid);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update notification.";

    const status =
      message === "Notification was not found."
        ? 404
        : message === "You cannot update this notification."
          ? 403
          : 500;

    if (status === 500) {
      console.error("Unable to mark notification as read.", error);
    }

    return NextResponse.json({ error: message }, { status });
  }
}

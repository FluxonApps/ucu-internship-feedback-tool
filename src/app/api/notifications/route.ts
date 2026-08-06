import { NextResponse } from "next/server";

import { AuthenticationError } from "@/server/auth/errors";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { listNotifications, markAllNotificationsAsRead } from "@/server/notifications/service";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const notifications = await listNotifications(user.uid);

    return NextResponse.json(notifications);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }

    console.error("Unable to load notifications.", error);

    return NextResponse.json(
      { error: "Unable to load notifications." },
      { status: 500 },
    );
  }
}

export async function PATCH() {
  try {
    const user = await requireAuthenticatedUser();

    await markAllNotificationsAsRead(user.uid);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }

    console.error("Unable to mark all notifications as read.", error);

    return NextResponse.json(
      { error: "Unable to mark all notifications as read." },
      { status: 500 },
    );
  }
}

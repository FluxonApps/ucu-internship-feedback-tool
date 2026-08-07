import { NextResponse } from "next/server";

import { AuthenticationError } from "@/server/auth/errors";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { deleteReadNotifications } from "@/server/notifications/service";

export async function DELETE() {
  try {
    const user = await requireAuthenticatedUser();

    await deleteReadNotifications(user.uid);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }

    console.error("Unable to delete read notifications.", error);

    return NextResponse.json(
      { error: "Unable to delete read notifications." },
      { status: 500 },
    );
  }
}

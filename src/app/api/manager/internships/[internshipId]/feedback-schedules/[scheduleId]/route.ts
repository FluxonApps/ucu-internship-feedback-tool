import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { requireRole } from "@/server/authorization/require-role";
import { cancelFeedbackSchedule } from "@/server/feedback/service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; scheduleId: string }> }
) {
  try {
    const user = await requireAuthenticatedUser();
    const context = await requireRole(user, "manager");

    const { internshipId, scheduleId } = await params;

    await cancelFeedbackSchedule(internshipId, scheduleId, context.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to cancel schedule:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel schedule" },
      { status: 500 }
    );
  }
}

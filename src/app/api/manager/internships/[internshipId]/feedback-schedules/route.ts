import { NextResponse } from "next/server";

import {
  feedbackErrorResponse,
  requireFeedbackMutationContext,
} from "@/server/feedback/http";
import { createFeedbackScheduleInputSchema } from "@/server/feedback/schemas";
import { scheduleFeedbackCycle, listFeedbackSchedules } from "@/server/feedback/service";

import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { requireRole } from "@/server/authorization/require-role";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    const context = await requireRole(user, "manager");

    const { internshipId } = await params;

    const schedules = await listFeedbackSchedules(internshipId, context.userId);

    return NextResponse.json(schedules);
  } catch (error) {
    return feedbackErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireFeedbackMutationContext(request, "manager");
    const { internshipId } = await params;

    const input = createFeedbackScheduleInputSchema.parse(await request.json());

    const schedule = await scheduleFeedbackCycle(internshipId, context.userId, input);

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    return feedbackErrorResponse(error);
  }
}

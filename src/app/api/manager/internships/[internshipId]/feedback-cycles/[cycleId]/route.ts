import { NextResponse } from "next/server";

import {
  feedbackErrorResponse,
  requireFeedbackMutationContext,
} from "@/server/feedback/http";
import { updateFeedbackCycleInputSchema } from "@/server/feedback/schemas";
import { updateFeedbackCycleDueDate } from "@/server/feedback/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; cycleId: string }> },
) {
  try {
    const context = await requireFeedbackMutationContext(request, "manager");
    const { internshipId, cycleId } = await params;
    const input = updateFeedbackCycleInputSchema.parse(await request.json());
    await updateFeedbackCycleDueDate(
      internshipId,
      cycleId,
      context.userId,
      input.dueAt,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return feedbackErrorResponse(error);
  }
}

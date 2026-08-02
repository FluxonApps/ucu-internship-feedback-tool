import { NextResponse } from "next/server";

import {
  feedbackErrorResponse,
  requireFeedbackMutationContext,
} from "@/server/feedback/http";
import { cancelFeedbackCycleInputSchema } from "@/server/feedback/schemas";
import { cancelFeedbackCycle } from "@/server/feedback/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; cycleId: string }> },
) {
  try {
    const context = await requireFeedbackMutationContext(request, "manager");
    const { internshipId, cycleId } = await params;
    const { reason } = cancelFeedbackCycleInputSchema.parse(await request.json());
    await cancelFeedbackCycle(internshipId, cycleId, context.userId, reason);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return feedbackErrorResponse(error);
  }
}

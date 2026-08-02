import { NextResponse } from "next/server";

import {
  feedbackErrorResponse,
  requireFeedbackMutationContext,
} from "@/server/feedback/http";
import { publishFeedbackCycleInputSchema } from "@/server/feedback/schemas";
import { publishFeedbackCycle } from "@/server/feedback/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; cycleId: string }> },
) {
  try {
    const context = await requireFeedbackMutationContext(request, "manager");
    const { internshipId, cycleId } = await params;
    const input = publishFeedbackCycleInputSchema.parse(await request.json());
    await publishFeedbackCycle(
      internshipId,
      cycleId,
      context.userId,
      input.managerRecommendation,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return feedbackErrorResponse(error);
  }
}

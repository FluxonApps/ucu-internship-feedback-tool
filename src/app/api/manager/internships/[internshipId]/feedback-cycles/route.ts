import { NextResponse } from "next/server";

import {
  feedbackErrorResponse,
  requireFeedbackMutationContext,
} from "@/server/feedback/http";
import { createFeedbackCycleInputSchema } from "@/server/feedback/schemas";
import { startFeedbackCycle } from "@/server/feedback/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireFeedbackMutationContext(request, "manager");
    const { internshipId } = await params;
    const input = createFeedbackCycleInputSchema.parse(await request.json());
    const cycle = await startFeedbackCycle(internshipId, context.userId, input);
    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    return feedbackErrorResponse(error);
  }
}

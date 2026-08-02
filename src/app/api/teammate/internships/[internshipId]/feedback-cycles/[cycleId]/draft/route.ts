import { NextResponse } from "next/server";

import {
  feedbackErrorResponse,
  requireFeedbackMutationContext,
} from "@/server/feedback/http";
import { feedbackAnswersInputSchema } from "@/server/feedback/schemas";
import { saveFeedbackDraft } from "@/server/feedback/service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; cycleId: string }> },
) {
  try {
    const context = await requireFeedbackMutationContext(request, "teammate");
    const { internshipId, cycleId } = await params;
    await saveFeedbackDraft(
      internshipId,
      cycleId,
      context.userId,
      feedbackAnswersInputSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return feedbackErrorResponse(error);
  }
}

import { NextResponse } from "next/server";

import {
  casualFeedbackErrorResponse,
  requireCasualFeedbackMutationContext,
} from "@/server/casual-feedback/http";
import { createCasualFeedbackNoteInputSchema } from "@/server/casual-feedback/schemas";
import { createCasualFeedbackNote } from "@/server/casual-feedback/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireCasualFeedbackMutationContext(request);
    const { internshipId } = await params;
    const input = createCasualFeedbackNoteInputSchema.parse(await request.json());
    const note = await createCasualFeedbackNote(internshipId, context.userId, input);
    return NextResponse.json({ ok: true, id: note.id }, { status: 201 });
  } catch (error) {
    return casualFeedbackErrorResponse(error);
  }
}

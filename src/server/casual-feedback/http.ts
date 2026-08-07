import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthenticationError } from "@/server/auth/errors";
import { hasValidRequestOrigin } from "@/server/auth/origin";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { AuthorizationError } from "@/server/authorization/errors";
import { requireRole } from "@/server/authorization/require-role";

export async function requireCasualFeedbackMutationContext(request: Request) {
  if (!hasValidRequestOrigin(request)) {
    throw new AuthorizationError("INVALID_REQUEST_ORIGIN", "Invalid request origin.");
  }
  return requireRole(await requireAuthenticatedUser(), "teammate");
}

export function casualFeedbackErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Invalid casual feedback data." },
      { status: 400 },
    );
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  const message =
    error instanceof Error ? error.message : "Unable to save casual feedback.";
  return NextResponse.json({ error: message }, { status: 400 });
}

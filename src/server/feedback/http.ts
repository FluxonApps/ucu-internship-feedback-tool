import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthorizationError } from "@/server/authorization/errors";
import { requireRole } from "@/server/authorization/require-role";
import { AuthenticationError } from "@/server/auth/errors";
import { hasValidRequestOrigin } from "@/server/auth/origin";
import { requireAuthenticatedUser } from "@/server/auth/require-user";

export async function requireFeedbackMutationContext(
  request: Request,
  role: "manager" | "teammate",
) {
  if (!hasValidRequestOrigin(request)) {
    throw new AuthorizationError("INVALID_REQUEST_ORIGIN", "Invalid request origin.");
  }
  return requireRole(await requireAuthenticatedUser(), role);
}

export function feedbackErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "Invalid feedback data." }, { status: 400 });
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  const message = error instanceof Error ? error.message : "Unable to save feedback.";
  const status = message.includes("already exists") ? 409 : 400;
  return NextResponse.json({ error: message }, { status });
}

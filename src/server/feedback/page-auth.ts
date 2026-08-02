import "server-only";

import { redirect } from "next/navigation";

import { getAuthorizationContext } from "@/server/authorization/context";
import { requireAuthenticatedUser } from "@/server/auth/require-user";

export async function requireGuestPage() {
  const context = await getAuthorizationContext(await requireAuthenticatedUser());
  if (context.access !== "guest") redirect("/forbidden");
  return context;
}

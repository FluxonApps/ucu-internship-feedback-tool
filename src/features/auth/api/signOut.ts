import { signOut } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export interface SignOutResponse {
  success: boolean;
}

export async function performSignOut(): Promise<SignOutResponse> {
  const response = await fetch("/api/auth/sign-out", { method: "POST" });

  if (!response.ok) {
    throw new Error("Unable to end the server session.");
  }

  await signOut(getFirebaseClientAuth()).catch(() => undefined);
  return { success: true };
}

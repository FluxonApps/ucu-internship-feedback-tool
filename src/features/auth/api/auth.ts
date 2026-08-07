import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export interface EstablishSessionPayload {
  credential: UserCredential;
}

export interface AuthenticateLocalPayload {
  email: string;
}

export interface AuthResponse {
  credential: UserCredential;
}

export async function establishServerSession(payload: EstablishSessionPayload): Promise<void> {
  const idToken = await payload.credential.user.getIdToken();
  const response = await fetch("/api/auth/session", {
    body: JSON.stringify({ idToken }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => undefined)) as
      | { error?: string }
      | undefined;
    throw new Error(result?.error ?? "Unable to create an application session.");
  }
}

export async function authenticateWithGoogle(): Promise<AuthResponse> {
  const auth = getFirebaseClientAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopup(auth, provider);
  return { credential };
}

export async function authenticateLocalPersona(payload: AuthenticateLocalPayload): Promise<AuthResponse> {
  const auth = getFirebaseClientAuth();
  const credential = await signInWithEmailAndPassword(auth, payload.email, "local-only-password");

  return { credential };
}

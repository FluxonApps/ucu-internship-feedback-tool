"use client";

import { useState } from "react";
import type { UserCredential } from "firebase/auth";
import { LoaderCircle, LogIn } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { getClientEnvironment } from "@/lib/env/client";
import {
  authenticateLocalPersona,
  authenticateWithGoogle,
  establishServerSession
} from "../api/auth";

export const localPersonas = [
  {
    id: "manager",
    name: "Maya Manager",
    email: "manager@example.com",
  },
  {
    id: "mentor",
    name: "Morgan Mentor",
    email: "mentor@example.com",
  },
  {
    id: "intern",
    name: "Indira Intern",
    email: "intern@example.com",
  },
  {
    id: "guest",
    name: "Gina Guest",
    email: "guest@example.com",
  },
] as const;

export function SignInCard() {
  const environment = getClientEnvironment();
  const [pendingPersona, setPendingPersona] = useState<string>();
  const [error, setError] = useState<string>();

  async function finishSignIn(credential: UserCredential) {
    await establishServerSession({ credential });
    window.location.assign("/");
  }

  async function signInWithGoogle() {
    setError(undefined);
    setPendingPersona("google");

    try {
      const response = await authenticateWithGoogle();
      await finishSignIn(response.credential);
    } catch (signInError) {
      setError(
        signInError instanceof Error ? signInError.message : "Google sign-in failed."
      );
      setPendingPersona(undefined);
    }
  }

  async function signInAsLocalPersona(persona: (typeof localPersonas)[number]) {
    setError(undefined);
    setPendingPersona(persona.id);

    try {
      const response = await authenticateLocalPersona({ email: persona.email });
      await finishSignIn(response.credential);
    } catch (signInError) {
      setError(
        signInError instanceof Error ? signInError.message : "Local sign-in failed."
      );
      setPendingPersona(undefined);
    }
  }

  return (
    <section className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-[0_24px_80px_rgba(22,78,63,0.10)] sm:p-9">
      <div className="mb-8">
        <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-[var(--brand)] text-sm font-bold text-white">
          F
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          Fluxon
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Internship Dashboard</h1>
        <p className="mt-3 leading-6 text-muted-foreground">
          Sign in to view the internship information available to you.
        </p>
      </div>

      {environment.authenticationMode === "email-password-development" ? (
        <div>
          <p className="mb-3 text-sm font-medium">Local development personas</p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {localPersonas.map((persona) => (
              <Button
                key={persona.id}
                variant="outline"
                className="h-auto w-full items-start justify-start px-3 py-3"
                disabled={Boolean(pendingPersona)}
                onClick={() => signInAsLocalPersona(persona)}
              >
                {pendingPersona === persona.id ? (
                  <LoaderCircle className="mt-0.5 shrink-0 animate-spin" />
                ) : null}
                <span className="min-w-0 text-left">
                  <span className="block font-medium">
                    Authenticate as {persona.id}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {persona.email}
                  </span>
                </span>
              </Button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Personas use only the Firebase development project.
          </p>
        </div>
      ) : (
        <Button
          className="h-11 w-full"
          disabled={Boolean(pendingPersona)}
          onClick={signInWithGoogle}
        >
          {pendingPersona === "google" ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <LogIn />
          )}
          Continue with Google
        </Button>
      )}

      {error ? (
        <div
          className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </section>
  );
}

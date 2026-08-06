"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { provisionUser } from "../api/provisionUser";

export function ProvisionUserForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await provisionUser({
        firstName,
        lastName,
        email,
        roles,
      });

      // Очищаємо форму після успішної відправки
      setFirstName("");
      setLastName("");
      setEmail("");
      setRoles([]);

      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to provision access.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm"
    >
      {/* Адаптивна сітка для імені та прізвища */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          First name
          <input
            name="firstName"
            type="text"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="John"
            className="h-10 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Last name
          <input
            name="lastName"
            type="text"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Doe"
            className="h-10 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="person@example.com"
          className="h-10 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <fieldset className="space-y-2 text-sm">
        <legend className="font-medium">Application access</legend>
        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              name="roles"
              type="checkbox"
              value="intern"
              checked={roles.includes("intern")}
              onChange={(event) =>
                setRoles((current) =>
                  event.target.checked
                    ? [...current, "intern"]
                    : current.filter((role) => role !== "intern"),
                )
              }
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />{" "}
            Intern
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              name="roles"
              type="checkbox"
              value="teammate"
              checked={roles.includes("teammate")}
              onChange={(event) =>
                setRoles((current) =>
                  event.target.checked
                    ? [...current, "teammate"]
                    : current.filter((role) => role !== "teammate"),
                )
              }
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />{" "}
            Teammate
          </label>
        </div>
      </fieldset>

      <p className="text-xs text-muted-foreground">
        The person can sign in later; their access is bound to that verified email on
        first sign-in.
      </p>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="pt-1">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Provisioning…" : "Provision access"}
        </Button>
      </div>
    </form>
  );
}

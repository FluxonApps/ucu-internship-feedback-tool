"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import type { ApplicationUserOption, TeamOption } from "@/lib/assignments/types";
import { getTeamOptions } from "../api/getTeamOptions";
import { createInternship } from "../api/createInternship";

export function CreateInternshipForm({
  interns,
  onSuccess,
}: {
  interns: ApplicationUserOption[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [internId, setInternId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTeamOptions()
      .then((body) => setTeams(body.teams ?? []))
      .catch(console.error);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const matchedTeam = teams.find(
      (team) => team.title.toLowerCase() === teamName.trim().toLowerCase(),
    );

    try {
      const body = await createInternship({
        internId,
        team: matchedTeam ? { teamId: matchedTeam.id } : { newTeamName: teamName },
        startsAt: new Date(`${startsAt}T00:00:00.000Z`).toISOString(),
      });

      onSuccess?.();
      router.push(`/manager/internships/${body.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to create the internship.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="grid gap-2 text-sm font-medium">
        Intern
        <select
          name="internId"
          required
          value={internId}
          onChange={(event) => setInternId(event.target.value)}
          className="h-10 rounded-lg border bg-background px-3"
        >
          <option value="">Select an intern</option>
          {interns.map((intern) => (
            <option key={intern.id} value={intern.id}>
              {intern.displayName} — {intern.email}
              {intern.identityState === "pending" ? " (awaiting sign-in)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Team
        <input
          required
          list="team-options"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="Select or enter a Team name"
          className="h-10 rounded-lg border bg-background px-3"
        />
        <datalist id="team-options">
          {teams.map((team) => (
            <option key={team.id} value={team.title} />
          ))}
        </datalist>
        <span className="text-xs font-normal text-muted-foreground">
          A new name creates a Team when you submit.
        </span>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Placement start date
        <input
          name="startsAt"
          type="date"
          required
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          className="h-10 rounded-lg border bg-background px-3"
        />
      </label>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create internship"}
      </Button>
    </form>
  );
}

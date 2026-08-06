"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { createCasualFeedbackNote } from "@/features/casual-feedback/api/createCasualFeedbackNote";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function CasualFeedbackForm({ internshipId }: { internshipId: string }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(today());
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!selectedDate) {
      setError("Choose a date.");
      return;
    }
    if (!text.trim()) {
      setError("Write the casual feedback note before saving.");
      return;
    }

    setSaving(true);
    try {
      const result = await createCasualFeedbackNote({
        internshipId,
        date: new Date(`${selectedDate}T00:00:00.000Z`).toISOString(),
        text,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setText("");
      setSelectedDate(today());
      router.refresh();
    } catch {
      setError("Unable to save casual feedback. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-muted/30 p-5">
      <label className="grid gap-2 text-sm font-medium sm:max-w-xs">
        Date
        <input
          type="date"
          required
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="h-10 rounded-lg border bg-background px-3"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Casual feedback
        <textarea
          required
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Share a quick, informal note about how things are going…"
          className="min-h-28 rounded-xl border bg-card p-3"
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save note"}
      </Button>
    </form>
  );
}

"use client";

import { type FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function StartFeedbackCycleDialog({ internshipId }: { internshipId: string }) {
  return (
    <Modal
      trigger={
        <Button type="button">
          <Plus data-icon="inline-start" /> Start feedback cycle
        </Button>
      }
      title="Start feedback cycle"
      description="All currently assigned teammates will receive the same form."
    >
      {(close) => (
        <StartFeedbackCycleForm internshipId={internshipId} onSuccess={close} />
      )}
    </Modal>
  );
}

function StartFeedbackCycleForm({
  internshipId,
  onSuccess,
}: {
  internshipId: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!startsAt || !endsAt) {
      setError("Choose the evaluation start and end dates.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/manager/internships/${internshipId}/feedback-cycles`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            evaluationStartsAt: new Date(`${startsAt}T00:00:00.000Z`).toISOString(),
            evaluationEndsAt: new Date(`${endsAt}T00:00:00.000Z`).toISOString(),
            ...(dueAt
              ? { dueAt: new Date(`${dueAt}T00:00:00.000Z`).toISOString() }
              : {}),
            customQuestions: questions,
          }),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Unable to start the feedback cycle.");
        return;
      }
      onSuccess();
      router.refresh();
    } catch {
      setError("Unable to start the feedback cycle. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Evaluation starts
          <input
            type="date"
            required
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Evaluation ends
          <input
            type="date"
            required
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Due date <span className="font-normal text-muted-foreground">(optional)</span>
        <input
          type="date"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
          className="h-10 rounded-lg border bg-background px-3"
        />
      </label>
      <fieldset className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-medium">Additional questions</legend>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuestions((current) => [...current, ""])}
          >
            <Plus /> Add question
          </Button>
        </div>
        {questions.map((question, index) => (
          <div key={index} className="flex gap-2">
            <input
              required
              value={question}
              onChange={(event) =>
                setQuestions((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
              placeholder={`Question ${index + 1}`}
              className="h-10 min-w-0 grow rounded-lg border bg-background px-3 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove question ${index + 1}`}
              onClick={() =>
                setQuestions((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Starting…" : "Start cycle"}
      </Button>
    </form>
  );
}

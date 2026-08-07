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

  // --- Нові стейти для розкладу ---
  const [startMode, setStartMode] = useState<"now" | "schedule">("now");
  const [scheduleType, setScheduleType] = useState<"automatic" | "reminder">("automatic");
  const [triggerAt, setTriggerAt] = useState("");

  // --- Існуючі стейти для самого циклу ---
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    // Базова валідація
    if (!startsAt || !endsAt) {
      setError("Choose the evaluation start and end dates.");
      return;
    }

    if (startMode === "schedule" && !triggerAt) {
      setError("Choose the date when this schedule should trigger.");
      return;
    }

    setSubmitting(true);

    try {
      // Визначаємо, куди і що саме ми відправляємо
      const isSchedule = startMode === "schedule";
      const endpoint = isSchedule
        ? `/api/manager/internships/${internshipId}/feedback-schedules`
        : `/api/manager/internships/${internshipId}/feedback-cycles`;

      // Формуємо шаблон циклу (він потрібен в обох випадках)
      const cycleTemplate = {
        evaluationStartsAt: new Date(`${startsAt}T00:00:00.000Z`).toISOString(),
        evaluationEndsAt: new Date(`${endsAt}T00:00:00.000Z`).toISOString(),
        ...(dueAt ? { dueAt: new Date(`${dueAt}T00:00:00.000Z`).toISOString() } : {}),
        customQuestions: questions.map((q) => ({ id: crypto.randomUUID(), prompt: q })), // додаємо ID для customQuestions
      };

      // Якщо це розклад, обгортаємо шаблон у додаткові поля розкладу
      const bodyPayload = isSchedule
        ? {
            type: scheduleType,
            triggerAt: new Date(`${triggerAt}T00:00:00.000Z`).toISOString(),
            cycleTemplate: cycleTemplate,
          }
        : cycleTemplate;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Unable to process your request.");
        return;
      }
      onSuccess();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">

      {/* 1. Блок вибору режиму */}
      <fieldset className="space-y-3 pb-4 border-b">
        <legend className="text-sm font-medium">Execution timing</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={startMode === "now"}
              onChange={() => setStartMode("now")}
            />
            Start cycle immediately
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={startMode === "schedule"}
              onChange={() => setStartMode("schedule")}
            />
            Schedule for later
          </label>
        </div>
      </fieldset>

      {/* 2. Блок налаштувань розкладу (видно тільки якщо обрали "schedule") */}
      {startMode === "schedule" && (
        <fieldset className="space-y-4 rounded-lg border bg-muted/50 p-4">
          <legend className="sr-only">Schedule settings</legend>
          <label className="grid gap-2 text-sm font-medium">
            Trigger date
            <input
              type="date"
              required={startMode === "schedule"}
              value={triggerAt}
              onChange={(event) => setTriggerAt(event.target.value)}
              className="h-10 rounded-lg border bg-background px-3"
            />
          </label>
          <div className="grid gap-2">
            <span className="text-sm font-medium">Action type</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={scheduleType === "automatic"}
                  onChange={() => setScheduleType("automatic")}
                />
                Auto-start cycle
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={scheduleType === "reminder"}
                  onChange={() => setScheduleType("reminder")}
                />
                Just remind me
              </label>
            </div>
          </div>
        </fieldset>
      )}

      {/* 3. Блок налаштувань самого циклу (дати і питання) */}
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
        {submitting ? "Processing…" : startMode === "schedule" ? "Schedule cycle" : "Start cycle"}
      </Button>
    </form>
  );
}

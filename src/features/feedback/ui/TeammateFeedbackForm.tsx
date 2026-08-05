"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { saveTeammateFeedback } from "@/features/feedback/api/saveTeammateFeedback";
import {
  feedbackMatrices,
  feedbackRatings,
  type FeedbackRating,
} from "@/lib/feedback/definitions";
import type {
  FeedbackAnswersDto,
  TeammateFeedbackDto,
} from "@/lib/feedback/types";

const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC" });

export function TeammateFeedbackForm({
  internshipId,
  item,
}: {
  internshipId: string;
  item: TeammateFeedbackDto;
}) {
  const router = useRouter();
  const initial = item.reviewer.response;

  const [ratings, setRatings] = useState<FeedbackAnswersDto["ratings"]>(
    initial?.ratings ?? {},
  );

  const [positiveFeedback, setPositiveFeedback] = useState(
    initial?.positiveFeedback ?? "",
  );

  const [constructiveFeedback, setConstructiveFeedback] = useState(
    initial?.constructiveFeedback ?? "",
  );

  const [managerOnlyFeedback, setManagerOnlyFeedback] = useState(
    initial?.managerOnlyFeedback ?? "",
  );

  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>(
    initial?.customAnswers ?? {},
  );

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const overdue =
    item.cycle.dueAt &&
    item.cycle.dueAt.slice(0, 10) < new Date().toISOString().slice(0, 10);

  const payload = {
    ratings,
    positiveFeedback,
    constructiveFeedback,
    managerOnlyFeedback,
    customAnswers,
  };

  async function save(submit: boolean) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
        const result = await saveTeammateFeedback({
        internshipId,
        cycleId: item.cycle.id,
        answers: payload,
        submit,
        });

        if (result.error) {
        setError(result.error);
        return;
        }

        if (submit) {
        router.refresh();
        } else {
        setMessage("Draft saved.");
        }
    } catch {
        setError("Unable to save feedback. Please try again.");
    } finally {
        setSaving(false);
    }
    }

  return (
    <form
      className="space-y-7"
      onSubmit={(event) => {
        event.preventDefault();
        void save(true);
      }}
    >
      <div className="rounded-xl bg-muted/40 p-5">
        <p className="font-semibold">
          Feedback for {date(item.cycle.evaluationStartsAt)} –{" "}
          {date(item.cycle.evaluationEndsAt)}
        </p>

        <p
          className={`mt-1 text-sm ${
            overdue ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {item.cycle.dueAt
            ? `${overdue ? "Overdue · " : ""}Due ${date(item.cycle.dueAt)}`
            : "No due date"}
        </p>
      </div>

      {feedbackMatrices.map((matrix) => (
        <fieldset
          key={matrix.value}
          className="space-y-3 rounded-xl bg-muted/30 p-5"
        >
          <legend className="px-1 text-lg font-semibold">
            {matrix.label}
          </legend>

          {matrix.criteria.map((criterion) => (
            <label
              key={criterion.value}
              className="grid gap-2 text-sm font-medium sm:grid-cols-[minmax(0,1fr)_minmax(14rem,1fr)] sm:items-center"
            >
              {criterion.label}

              <select
                required
                value={ratings[criterion.value] ?? ""}
                onChange={(event) =>
                  setRatings((current) => ({
                    ...current,
                    [criterion.value]: Number(
                      event.target.value,
                    ) as FeedbackRating,
                  }))
                }
                className="h-10 rounded-lg border bg-background px-3"
              >
                <option value="">Select a rating</option>

                {feedbackRatings.map((rating) => (
                  <option key={rating.value} value={rating.value}>
                    {rating.value} — {rating.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
      ))}

      <TextArea
        label="What the intern was doing well"
        required
        value={positiveFeedback}
        onChange={setPositiveFeedback}
      />

      <TextArea
        label="What the intern could be doing even better"
        required
        value={constructiveFeedback}
        onChange={setConstructiveFeedback}
      />

      <details className="rounded-xl bg-muted/40 p-4">
        <summary className="cursor-pointer font-medium">
          What the manager should know or act on
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Optional · visible to assigned managers only
          </span>
        </summary>

        <label className="mt-3 grid gap-2 text-sm font-medium">
          Details for the manager

          <textarea
            value={managerOnlyFeedback}
            onChange={(event) => setManagerOnlyFeedback(event.target.value)}
            className="min-h-28 rounded-xl border bg-background p-3"
          />
        </label>
      </details>

      {item.cycle.customQuestions.map((question) => (
        <TextArea
          key={question.id}
          label={question.prompt}
          required
          value={customAnswers[question.id] ?? ""}
          onChange={(value) =>
            setCustomAnswers((current) => ({
              ...current,
              [question.id]: value,
            }))
          }
        />
      ))}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {message ? (
        <p role="status" className="text-sm text-[var(--brand-strong)]">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => void save(false)}
        >
          {saving ? "Saving…" : "Save draft"}
        </Button>

        <Button type="submit" disabled={saving}>
          {saving ? "Submitting…" : "Submit feedback"}
        </Button>
      </div>
    </form>
  );
}

function TextArea({
  label,
  hint,
  required,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}

      {hint ? (
        <span className="text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      ) : null}

      <textarea
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 rounded-xl border bg-card p-3"
      />
    </label>
  );
}

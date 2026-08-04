"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import {
  feedbackMatrices,
  feedbackRatings,
  type FeedbackRating,
} from "@/lib/feedback/definitions";
import type { FeedbackAnswersDto, TeammateFeedbackDto } from "@/lib/feedback/types";

const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC" });

export function TeammateFeedbackPanel({
  internshipId,
  feedback,
}: {
  internshipId: string;
  feedback: TeammateFeedbackDto[];
}) {
  const active = feedback.find(
    (item) => item.cycle.state === "collecting" && item.reviewer.status !== "submitted",
  );
  const submitted = feedback.filter((item) => item.reviewer.status === "submitted");
  return (
    <div className="space-y-8">
      {active ? (
        <FeedbackForm internshipId={internshipId} item={active} />
      ) : submitted.length ? (
        <div className="rounded-xl bg-muted/40 p-5">
          <p className="font-medium">No feedback task is currently open.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your submitted responses remain available in history.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-muted/40 p-6 text-sm text-muted-foreground">
          No feedback task is currently assigned to you.
        </div>
      )}
      {submitted.length ? (
        <section className="space-y-3">
          <div>
            <h3 className="font-semibold">Your feedback history</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Only your own submissions are shown.
            </p>
          </div>
          {submitted.map((item) => (
            <HistoryCard key={item.cycle.id} item={item} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function FeedbackForm({
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
      const response = await fetch(
        `/api/teammate/internships/${internshipId}/feedback-cycles/${item.cycle.id}/${submit ? "submit" : "draft"}`,
        {
          method: submit ? "POST" : "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Unable to save feedback.");
        return;
      }
      if (submit) router.refresh();
      else setMessage("Draft saved.");
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
          className={`mt-1 text-sm ${overdue ? "text-destructive" : "text-muted-foreground"}`}
        >
          {item.cycle.dueAt
            ? `${overdue ? "Overdue · " : ""}Due ${date(item.cycle.dueAt)}`
            : "No due date"}
        </p>
      </div>
      {feedbackMatrices.map((matrix) => (
        <fieldset key={matrix.value} className="space-y-3 rounded-xl bg-muted/30 p-5">
          <legend className="px-1 text-lg font-semibold">{matrix.label}</legend>
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
                    [criterion.value]: Number(event.target.value) as FeedbackRating,
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

        {item.cycle.customQuestions.length > 0 ? (
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Additional questions
            </h4>

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
          </section>
        ) : null}

        <section className="space-y-2 rounded-lg border border-dashed bg-background/70 p-3">
          <div>
            <p className="font-medium">Manager-only notes</p>
            <p className="text-xs text-muted-foreground">
              Visible only to assigned managers.
            </p>
          </div>

          <details>
            <summary className="cursor-pointer font-medium">
              What the manager should know or act on
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
        </section>
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
        <span className="text-xs font-normal text-muted-foreground">{hint}</span>
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

function HistoryCard({ item }: { item: TeammateFeedbackDto }) {
  const response = item.reviewer.response;
  if (!response) return null;
  return (
    <details className="rounded-xl bg-muted/40 p-4">
      <summary className="cursor-pointer font-medium">
        {date(item.cycle.evaluationStartsAt)} – {date(item.cycle.evaluationEndsAt)}
      </summary>
      <div className="mt-4 space-y-4 text-sm">
        {feedbackMatrices.map((matrix) => (
          <div key={matrix.value}>
            <p className="font-medium">{matrix.label}</p>
            <dl className="mt-2 grid gap-1">
              {matrix.criteria.map((criterion) => (
                <div key={criterion.value} className="flex justify-between gap-4">
                  <dt>{criterion.label}</dt>
                  <dd>
                    {response.ratings[criterion.value]
                      ? `${response.ratings[criterion.value]} — ${feedbackRatings.find((rating) => rating.value === response.ratings[criterion.value])?.label}`
                      : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        <p>
          <strong>What the intern was doing well:</strong>{" "}
          {response.positiveFeedback}
        </p>

        <p>
          <strong>What the intern could be doing even better:</strong>{" "}
          {response.constructiveFeedback}
        </p>

        {item.cycle.customQuestions.length > 0 ? (
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Additional questions
            </h4>

            {item.cycle.customQuestions.map((question) => (
              <p key={question.id}>
                <strong>{question.prompt}:</strong>{" "}
                {response.customAnswers[question.id]}
              </p>
            ))}
          </section>
        ) : null}

        {response.managerOnlyFeedback ? (
          <section className="space-y-2 rounded-lg border border-dashed bg-background/70 p-3">
            <div>
              <p className="font-medium">Manager-only notes</p>
              <p className="text-xs text-muted-foreground">
                Visible only to assigned managers.
              </p>
            </div>

            <details>
              <summary className="cursor-pointer font-medium">
                What the manager should know or act on
              </summary>
              <p className="mt-2 whitespace-pre-wrap">
                {response.managerOnlyFeedback}
              </p>
            </details>
          </section>
        ) : null}
      </div>
    </details>
  );
}

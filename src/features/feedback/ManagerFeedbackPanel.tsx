"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { feedbackMatrices, feedbackRatings } from "@/lib/feedback/definitions";
import type { FeedbackCycleDto } from "@/lib/feedback/types";

import { FeedbackPublicationContent } from "./FeedbackPublicationContent";
import { StartFeedbackCycleDialog } from "./StartFeedbackCycleDialog";

const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC" });

export function ManagerFeedbackPanel({
  internshipId,
  cycles,
}: {
  internshipId: string;
  cycles: FeedbackCycleDto[];
}) {
  const collecting = cycles.find((cycle) => cycle.state === "collecting");
  const published = cycles.filter((cycle) => cycle.state === "published");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Feedback cycles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Collect structured feedback from every assigned teammate.
          </p>
        </div>
        {!collecting ? <StartFeedbackCycleDialog internshipId={internshipId} /> : null}
      </div>
      {collecting ? (
        <CycleCard internshipId={internshipId} cycle={collecting} />
      ) : (
        <div className="rounded-xl bg-muted/40 p-6 text-sm text-muted-foreground">
          No feedback cycle is collecting.
        </div>
      )}
      {published.length ? (
        <section className="space-y-3 pt-4">
          <div>
            <h3 className="font-semibold">Published history</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Published feedback is permanent. Private actionable notes remain available
              to assigned managers.
            </p>
          </div>
          {published.map((cycle) => (
            <PublishedManagerCycle key={cycle.id} cycle={cycle} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function CycleCard({
  internshipId,
  cycle,
}: {
  internshipId: string;
  cycle: FeedbackCycleDto;
}) {
  return (
    <article className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {date(cycle.evaluationStartsAt)} – {date(cycle.evaluationEndsAt)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {cycle.dueAt ? `Due ${date(cycle.dueAt)}` : "No due date"} ·{" "}
            {cycle.reviewers.length} reviewers
          </p>
        </div>
        <div className="flex gap-2">
          <EditDueDate
            internshipId={internshipId}
            cycleId={cycle.id}
            dueAt={cycle.dueAt}
          />
          <PublishCycle internshipId={internshipId} cycle={cycle} />
          <CancelCycle internshipId={internshipId} cycleId={cycle.id} />
        </div>
      </div>
      <div className="space-y-3">
        {cycle.reviewers.map((reviewer) => (
          <details key={reviewer.reviewerUserId} className="rounded-lg bg-muted/40 p-3">
            <summary className="cursor-pointer font-medium">
              {reviewer.reviewerDisplayName} ·{" "}
              <span className="font-normal text-muted-foreground">
                {reviewer.status}
              </span>
            </summary>
            {reviewer.response ? (
              <div className="mt-4 space-y-4 text-sm">
                {feedbackMatrices.map((matrix) => (
                  <div key={matrix.value}>
                    <p className="font-medium">{matrix.label}</p>
                    <dl className="mt-2 grid gap-1">
                      {matrix.criteria.map((criterion) => {
                        const score = reviewer.response?.ratings[criterion.value];
                        return (
                          <div
                            key={criterion.value}
                            className="flex justify-between gap-4"
                          >
                            <dt>{criterion.label}</dt>
                            <dd>
                              {feedbackRatings.find((item) => item.value === score)
                                ?.label ?? "—"}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                ))}

              <section className="space-y-3">
                <p>
                  <strong>What the intern was doing well:</strong>{" "}
                  {reviewer.response.positiveFeedback}
                </p>

                <p>
                  <strong>What the intern could be doing even better:</strong>{" "}
                  {reviewer.response.constructiveFeedback}
                </p>
              </section>

                {cycle.customQuestions.length > 0 ? (
                  <section className="space-y-3">
                    <h4 className="text-base font-semibold text-muted-foreground">
                      Additional questions
                    </h4>

                    {cycle.customQuestions.map((question) => (
                      <p key={question.id}>
                        <strong>{question.prompt}:</strong>{" "}
                        {reviewer.response?.customAnswers[question.id]}
                      </p>
                    ))}
                  </section>
                ) : null}
                {reviewer.response.managerOnlyFeedback ? (
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
                        {reviewer.response.managerOnlyFeedback}
                      </p>
                    </details>
                  </section>
                ) : null}
              </div>
            ) : reviewer.status === "draft" ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Draft answers remain private until submission.
              </p>
            ) : null}
          </details>
        ))}
      </div>
    </article>
  );
}

function PublishedManagerCycle({ cycle }: { cycle: FeedbackCycleDto }) {
  return (
    <details className="rounded-xl bg-muted/30 p-4">
      <summary className="cursor-pointer font-medium">
        {date(cycle.evaluationStartsAt)} – {date(cycle.evaluationEndsAt)}
        <span className="ml-2 font-normal text-muted-foreground">Published</span>
      </summary>
      <div className="mt-5 space-y-5">
        <FeedbackPublicationContent
          publication={{
            ...cycle.publicationPreview,
            internshipId: "",
            internDisplayName: "",
            cycleId: cycle.id,
            evaluationStartsAt: cycle.evaluationStartsAt,
            evaluationEndsAt: cycle.evaluationEndsAt,
            publishedAt: cycle.publishedAt ?? "",
            publishedByDisplayName: cycle.publishedByDisplayName ?? "Unknown manager",
            managerRecommendation: cycle.managerRecommendation ?? "",
          }}
        />
        {cycle.reviewers.some((reviewer) =>
          reviewer.response?.managerOnlyFeedback.trim(),
        ) ? (
          <section className="space-y-3">
            <h4 className="font-semibold">Private actionable feedback</h4>
            {cycle.reviewers.flatMap((reviewer) =>
              reviewer.response?.managerOnlyFeedback.trim()
                ? [
                    <div
                      key={reviewer.reviewerUserId}
                      className="rounded-xl bg-background/70 p-4 text-sm"
                    >
                      <p className="font-medium">{reviewer.reviewerDisplayName}</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {reviewer.response.managerOnlyFeedback}
                      </p>
                    </div>,
                  ]
                : [],
            )}
          </section>
        ) : null}
      </div>
    </details>
  );
}

function PublishCycle({
  internshipId,
  cycle,
}: {
  internshipId: string;
  cycle: FeedbackCycleDto;
}) {
  const router = useRouter();
  const [managerRecommendation, setManagerRecommendation] = useState("");
  const [confirmedMissing, setConfirmedMissing] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const preview = cycle.publicationPreview;
  const hasMissing = preview.submittedReviewerCount < preview.reviewerCount;

  async function submit(event: FormEvent, close: () => void) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/manager/internships/${internshipId}/feedback-cycles/${cycle.id}/publish`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ managerRecommendation }),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Unable to publish feedback.");
        return;
      }
      close();
      router.refresh();
    } catch {
      setError("Unable to publish feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      trigger={<Button type="button">Preview and publish</Button>}
      title="Publish feedback"
      description="Preview exactly what the intern and guests will see. Publication is permanent."
    >
      {(close) => (
        <form className="space-y-6" onSubmit={(event) => submit(event, close)}>
          <div
            className={`rounded-xl p-4 text-sm ${hasMissing ? "bg-amber-500/10 text-amber-900" : "bg-muted/40"}`}
          >
            <p className="font-medium">
              {preview.submittedReviewerCount} of {preview.reviewerCount} reviewers
              submitted
            </p>
            {hasMissing ? (
              <p className="mt-1">
                Missing: {preview.missingReviewerNames.join(", ")}. Their responses
                cannot be added after publication.
              </p>
            ) : null}
          </div>
          <FeedbackPublicationContent
            publication={preview}
            showRecommendation={false}
          />
          <label className="grid gap-2 text-sm font-medium">
            Manager recommendation
            <textarea
              required
              maxLength={10_000}
              value={managerRecommendation}
              onChange={(event) => setManagerRecommendation(event.target.value)}
              className="min-h-32 rounded-xl border bg-background p-3"
            />
          </label>
          {hasMissing ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                required
                type="checkbox"
                checked={confirmedMissing}
                onChange={(event) => setConfirmedMissing(event.target.checked)}
                className="mt-0.5"
              />
              Publish permanently without the missing responses.
            </label>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={
              submitting ||
              !managerRecommendation.trim() ||
              (hasMissing && !confirmedMissing)
            }
          >
            {submitting ? "Publishing…" : "Publish permanently"}
          </Button>
        </form>
      )}
    </Modal>
  );
}

function EditDueDate({
  internshipId,
  cycleId,
  dueAt,
}: {
  internshipId: string;
  cycleId: string;
  dueAt?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(dueAt?.slice(0, 10) ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent, close: () => void) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/manager/internships/${internshipId}/feedback-cycles/${cycleId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dueAt: value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null,
          }),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Unable to update the due date.");
        return;
      }
      close();
      router.refresh();
    } catch {
      setError("Unable to update the due date. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      trigger={
        <Button type="button" variant="outline">
          Edit due date
        </Button>
      }
      title="Edit due date"
      description="The due date does not automatically stop feedback collection."
    >
      {(close) => (
        <form className="space-y-4" onSubmit={(event) => submit(event, close)}>
          <label className="grid gap-2 text-sm font-medium">
            Due date{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
            <input
              type="date"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="h-10 rounded-lg border bg-background px-3"
            />
          </label>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save due date"}
          </Button>
        </form>
      )}
    </Modal>
  );
}

function CancelCycle({
  internshipId,
  cycleId,
}: {
  internshipId: string;
  cycleId: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent, close: () => void) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/manager/internships/${internshipId}/feedback-cycles/${cycleId}/cancel`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: reason || undefined }),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Unable to cancel the cycle.");
        return;
      }
      close();
      router.refresh();
    } catch {
      setError("Unable to cancel the cycle. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <Modal
      trigger={
        <Button type="button" variant="destructive">
          Cancel cycle
        </Button>
      }
      title="Cancel feedback cycle"
      description="This permanently stops collection. Drafts and submissions remain stored for audit."
    >
      {(close) => (
        <form className="space-y-4" onSubmit={(event) => submit(event, close)}>
          <label className="grid gap-2 text-sm font-medium">
            Reason <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-24 rounded-lg border bg-background p-3"
            />
          </label>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="destructive" disabled={submitting}>
            {submitting ? "Cancelling…" : "Cancel cycle"}
          </Button>
        </form>
      )}
    </Modal>
  );
}

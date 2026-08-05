"use client";

import { TeammateFeedbackForm } from "@/features/feedback/ui/TeammateFeedbackForm";
import type { TeammateFeedbackDto } from "@/lib/feedback/types";
import { FeedbackHistoryCard } from "@/features/feedback/ui/FeedbackHistoryCard";

export function TeammateFeedbackPanel({
  internshipId,
  feedback,
}: {
  internshipId: string;
  feedback: TeammateFeedbackDto[];
}) {
  const active = feedback.find(
    (item) =>
      item.cycle.state === "collecting" &&
      item.reviewer.status !== "submitted",
  );

  const submitted = feedback.filter(
    (item) => item.reviewer.status === "submitted",
  );

  return (
    <div className="space-y-8">
      {active ? (
        <TeammateFeedbackForm internshipId={internshipId} item={active} />
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
            <FeedbackHistoryCard key={item.cycle.id} item={item} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

import { notFound } from "next/navigation";

import { FeedbackProgressComparison } from "@/features/feedback/ui/FeedbackProgressComparison";
import { FeedbackScoreTrendChart } from "@/features/feedback/ui/FeedbackScoreTrendChart";
import { getInternIdByInternship } from "@/server/assignments/service";
import {
  getFeedbackProgressComparison,
  getInternAnalyticsOverview,
} from "@/features/feedback/api/getFeedbackProgressComparison";
import { getFeedbackScoreTrend } from "@/features/feedback/api/getFeedbackScoreTrend";
import { DevelopmentInsights } from "@/features/feedback/ui/DevelopmentInsights";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    internId?: string;
    internshipId?: string;
  }>;
}) {
  const { internId, internshipId } = await searchParams;

  if (!internId && !internshipId) {
    notFound();
  }

  let resolvedInternId = internId;

  if (!resolvedInternId && internshipId) {
    resolvedInternId = await getInternIdByInternship(internshipId);
  }

  const [analytics, overview, scoreTrend] =
    internshipId && resolvedInternId
      ? await Promise.all([
          getFeedbackProgressComparison(
            internshipId,
            resolvedInternId,
          ),
          getInternAnalyticsOverview(
            internshipId,
            resolvedInternId,
          ),
          getFeedbackScoreTrend(
            internshipId,
            resolvedInternId,
          ),
        ])
      : [undefined, undefined, undefined];

  return (
    <section className="space-y-7">
      <h1 className="text-3xl font-semibold tracking-tight">
        Intern analytics
      </h1>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-semibold">
          Overview
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              Feedback cycles
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {overview?.feedbackCycles ?? 0}
            </p>
          </div>

          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              Current average score
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {overview?.currentAverageScore !== undefined
                ? `${overview.currentAverageScore}/5`
                : "—"}
            </p>
          </div>

          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              Progress trend
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {overview?.progressTrend !== undefined
                ? `${overview.progressTrend > 0 ? "+" : ""}${overview.progressTrend}`
                : "—"}
            </p>
          </div>
        </div>
      </section>

      {analytics ? (
        <>
            <FeedbackProgressComparison
            cycles={analytics.cycles}
            />

            <DevelopmentInsights ratings={analytics.cycles[0].ratings} />
        </>
        ) : (
        <section className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
            Some analytics features are unavailable because there is not enough
            feedback history yet.
            </p>
        </section>
)}

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-semibold">
          Average score trend
        </h2>

        {scoreTrend && scoreTrend.length > 0 ? (
          <FeedbackScoreTrendChart data={scoreTrend} />
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No trend data available yet.
          </p>
        )}
      </section>
    </section>
  );
}

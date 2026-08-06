import { notFound } from "next/navigation";

import { FeedbackProgressComparison } from "@/features/feedback/ui/FeedbackProgressComparison";
import { getFeedbackProgressComparison } from "@/features/feedback/api/getFeedbackProgressComparison";
import { getInternIdByInternship } from "@/server/assignments/service";

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

  const analytics =
    internshipId && resolvedInternId
      ? await getFeedbackProgressComparison(
          internshipId,
          resolvedInternId,
        )
      : undefined;

  return (
    <section className="space-y-7">
      <h1 className="text-3xl font-semibold tracking-tight">
        Intern analytics
      </h1>

      {analytics ? (
        <FeedbackProgressComparison
          previousRatings={analytics.previous}
          currentRatings={analytics.current}
        />
      ) : (
        <section className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Some analytics features are unavailable because there is not enough
            feedback history yet.
          </p>
        </section>
      )}
    </section>
  );
}

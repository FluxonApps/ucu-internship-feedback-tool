import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { calculateHealthScore } from "@/lib/feedback/health-score";
import type { FeedbackPublicationPreviewDto } from "@/lib/feedback/types";

export function HealthScoreSection({
  publication,
}: {
  publication: FeedbackPublicationPreviewDto;
}) {
  const health = calculateHealthScore(publication.ratings);

  return (
    <section className="rounded-xl border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold">Overall Health Score</h3>
        <p className="text-sm text-muted-foreground">
        </p>
      </div>
      <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_240px]">
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Overall</p>

          <div className="mt-4 flex justify-center">
            <ScoreCircle
              value={health.overallAverage}
              size={150}
            />
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Overall average across all feedback criteria.
          </p>
        </div>
        <div className="space-y-6">
          <div className="rounded-lg border p-5">
            <p className="text-sm text-muted-foreground">
              Soft Skills Average
            </p>
            <div className="mt-4 flex justify-center">
              <ScoreCircle
                value={health.softAverage}
                size={100}
              />
            </div>
          </div>

          <div className="rounded-lg border p-5">
            <p className="text-sm text-muted-foreground">
              Technical Skills Average
            </p>

            <div className="mt-4 flex justify-center">
              <ScoreCircle
                value={health.technicalAverage}
                size={100}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

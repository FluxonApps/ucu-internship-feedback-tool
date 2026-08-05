import {
  feedbackMatrices,
  type FeedbackCriterion,
} from "@/lib/feedback/definitions";

type FeedbackProgressComparisonProps = {
  previousRatings: Partial<Record<FeedbackCriterion, number>>;
  currentRatings: Partial<Record<FeedbackCriterion, number>>;
};

export function FeedbackProgressComparison({
  previousRatings,
  currentRatings,
}: FeedbackProgressComparisonProps) {
  return (
    <div className="space-y-6">
      {feedbackMatrices.map((matrix) => (
        <section key={matrix.value}>
          <h3 className="font-semibold">{matrix.label}</h3>

          <div className="mt-3 space-y-2">
            {matrix.criteria.map((criterion) => {
              const previous = previousRatings[criterion.value];
              const current = currentRatings[criterion.value];

              if (previous === undefined || current === undefined) {
                return null;
              }

              const difference = current - previous;

              return (
                <div
                  key={criterion.value}
                  className="flex items-center justify-between gap-4 rounded-lg bg-muted/30 px-4 py-3"
                >
                  <span>{criterion.label}</span>

                  <span className="font-medium">
                    {previous.toFixed(1)}
                    <span className="mx-2 text-muted-foreground">→</span>
                    {current.toFixed(1)}

                    {difference > 0 ? (
                      <span className="ml-2 text-green-600">↑</span>
                    ) : difference < 0 ? (
                      <span className="ml-2 text-red-600">↓</span>
                    ) : (
                      <span className="ml-2 text-muted-foreground">→</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

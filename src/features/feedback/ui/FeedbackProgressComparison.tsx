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
    <details className="rounded-xl bg-muted/30 p-4">
      <summary className="cursor-pointer font-semibold">
        View feedback progress
      </summary>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {feedbackMatrices.map((matrix) => (
          <section
            key={matrix.value}
            className="rounded-xl bg-muted/35 p-5"
          >
            <h4 className="font-semibold">{matrix.label}</h4>

            <dl className="mt-3 grid gap-2 text-sm">
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
                    className="flex items-start justify-between gap-4"
                  >
                    <dt>{criterion.label}</dt>

                    <dd className="text-right font-medium">
                      {difference === 0 ? (
                        current.toFixed(1)
                      ) : (
                        <>
                          {previous.toFixed(1)}
                          <span className="mx-2 text-muted-foreground">
                            →
                          </span>

                          <span
                            className={
                              difference > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {current.toFixed(1)}
                          </span>

                          <span
                            className={`ml-2 ${
                              difference > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {difference > 0 ? "↑" : "↓"}
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>
    </details>
  );
}

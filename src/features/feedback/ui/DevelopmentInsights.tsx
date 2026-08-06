import {
  feedbackMatrices,
  type FeedbackCriterion,
} from "@/lib/feedback/definitions";

type DevelopmentInsightsProps = {
  ratings: Partial<Record<FeedbackCriterion, number>>;
};

export function DevelopmentInsights({
  ratings,
}: DevelopmentInsightsProps) {
  const sorted = Object.entries(ratings)
    .filter(([, value]) => value !== undefined)
    .sort(([, a], [, b]) => Number(a) - Number(b));

  const needsImprovement = sorted.slice(0, 2);
  const strengths = sorted.slice(-2).reverse();

  const getCriterionLabel = (value: string) => {
    for (const matrix of feedbackMatrices) {
      const criterion = matrix.criteria.find(
        (item) => item.value === value,
      );

      if (criterion) {
        return criterion.label;
      }
    }

    return value;
  };

  return (
    <section className="rounded-xl bg-muted/30 p-4">
      <h3 className="text-lg font-semibold">
        Development insights
      </h3>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-muted/35 p-5">
          <h4 className="font-medium">
            Needs improvement
          </h4>

          <dl className="mt-3 space-y-3 text-sm">
            {needsImprovement.map(([criterion, value]) => (
              <div
                key={criterion}
                className="flex items-center justify-between gap-4"
              >
                <dt className="text-foreground">
                  {getCriterionLabel(criterion)}
                </dt>

                <dd className="font-medium text-red-600">
                  {Number(value).toFixed(1)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl bg-muted/35 p-5">
          <h4 className="font-medium">
            Strengths
          </h4>

          <dl className="mt-3 space-y-3 text-sm">
            {strengths.map(([criterion, value]) => (
              <div
                key={criterion}
                className="flex items-center justify-between gap-4"
              >
                <dt className="text-foreground">
                  {getCriterionLabel(criterion)}
                </dt>

                <dd className="font-medium text-green-600">
                  {Number(value).toFixed(1)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

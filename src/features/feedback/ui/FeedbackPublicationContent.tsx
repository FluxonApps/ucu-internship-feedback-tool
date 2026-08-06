import { feedbackMatrices, feedbackRatings } from "@/lib/feedback/definitions";
import type {
  FeedbackPublicationPreviewDto,
  PublishedFeedbackDto,
} from "@/lib/feedback/types";
import { teammateResponsibilities } from "@/lib/teammate-responsibilities";
import { HealthScoreSection } from "./HealthScoreSection";

const responsibilityLabels = new Map(
  teammateResponsibilities.map((item) => [item.value, item.label]),
);

function attribution(
  answer: FeedbackPublicationPreviewDto["questions"][number]["answers"][number],
) {
  const labels = teammateResponsibilities.flatMap((definition) =>
    answer.responsibilities.includes(definition.value)
      ? [responsibilityLabels.get(definition.value)]
      : [],
  );
  return labels.length
    ? `${answer.reviewerDisplayName} (${labels.join(", ")})`
    : answer.reviewerDisplayName;
}

export function FeedbackPublicationContent({
  publication,
  showRecommendation = true,
}: {
  publication: FeedbackPublicationPreviewDto | PublishedFeedbackDto;
  showRecommendation?: boolean;
}) {
  const published = "managerRecommendation" in publication ? publication : undefined;

  return (
    <div className="space-y-7">
      <HealthScoreSection publication={publication} />

      <div className="grid gap-4 xl:grid-cols-2">
        {feedbackMatrices.map((matrix) => (
          <section key={matrix.value} className="rounded-xl bg-muted/35 p-5">
            <h4 className="font-semibold">{matrix.label}</h4>
            <dl className="mt-3 grid gap-2 text-sm">
              {matrix.criteria.map((criterion) => {
                const rating = publication.ratings[criterion.value];
                return (
                  <div
                    key={criterion.value}
                    className="flex items-start justify-between gap-4"
                  >
                    <dt>{criterion.label}</dt>
                    <dd className="text-right font-medium">
                      {feedbackRatings.find((item) => item.value === rating)?.label ??
                        "Not available"}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>

      {publication.questions.map((question) => (
        <section key={question.id} className="space-y-3">
          <h4 className="font-semibold">{question.prompt}</h4>
          {question.answers.length ? (
            <div className="space-y-3">
              {question.answers.map((answer) => (
                <div
                  key={answer.reviewerUserId}
                  className="rounded-xl bg-muted/35 p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-medium">{attribution(answer)}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                        Overall: {typeof (answer as any).overallScore === "number" && (answer as any).overallScore > 0
                          ? ((answer as any).overallScore).toFixed(1)
                          : "-"}
                      </span>

                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        Soft: {typeof (answer as any).softScore === "number" && (answer as any).softScore > 0
                          ? ((answer as any).softScore).toFixed(1)
                          : "-"}
                      </span>

                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                        Tech: {typeof (answer as any).techScore === "number" && (answer as any).techScore > 0
                          ? ((answer as any).techScore).toFixed(1)
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                    {answer.answer}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No submitted answers.</p>
          )}
        </section>
      ))}

      {published && showRecommendation ? (
        <section className="rounded-xl bg-[var(--brand)]/10 p-5">
          <h4 className="font-semibold">Manager recommendation</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {published.publishedByDisplayName}
          </p>
          <p className="mt-3 whitespace-pre-wrap">{published.managerRecommendation}</p>
        </section>
      ) : null}
    </div>
  );
}

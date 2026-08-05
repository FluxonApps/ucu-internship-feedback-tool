import {
  feedbackMatrices,
  feedbackRatings,
} from "@/lib/feedback/definitions";
import type { TeammateFeedbackDto } from "@/lib/feedback/types";

const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC" });

export function FeedbackHistoryCard({
  item,
}: {
  item: TeammateFeedbackDto;
}) {
  const response = item.reviewer.response;

  if (!response) return null;

  return (
    <details className="rounded-xl bg-muted/40 p-4">
      <summary className="cursor-pointer font-medium">
        {date(item.cycle.evaluationStartsAt)} –{" "}
        {date(item.cycle.evaluationEndsAt)}
      </summary>

      <div className="mt-4 space-y-4 text-sm">
        {feedbackMatrices.map((matrix) => (
          <div key={matrix.value}>
            <p className="font-medium">{matrix.label}</p>

            <dl className="mt-2 grid gap-1">
              {matrix.criteria.map((criterion) => (
                <div
                  key={criterion.value}
                  className="flex justify-between gap-4"
                >
                  <dt>{criterion.label}</dt>

                  <dd>
                    {response.ratings[criterion.value]
                      ? `${response.ratings[criterion.value]} — ${
                          feedbackRatings.find(
                            (rating) =>
                              rating.value ===
                              response.ratings[criterion.value],
                          )?.label
                        }`
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

        {response.managerOnlyFeedback ? (
          <details className="rounded-lg bg-background/70 p-3">
            <summary className="cursor-pointer font-medium">
              What the manager should know or act on
            </summary>

            <p className="mt-2">{response.managerOnlyFeedback}</p>
          </details>
        ) : null}

        {item.cycle.customQuestions.map((question) => (
          <p key={question.id}>
            <strong>{question.prompt}:</strong>{" "}
            {response.customAnswers[question.id]}
          </p>
        ))}
      </div>
    </details>
  );
}

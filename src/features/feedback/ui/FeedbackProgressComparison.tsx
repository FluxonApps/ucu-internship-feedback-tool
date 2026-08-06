"use client";

import { useState } from "react";

import {
  feedbackMatrices,
  type FeedbackCriterion,
} from "@/lib/feedback/definitions";


function formatCycleDate(date: string) {
  return new Date(date).toLocaleDateString();
}

type FeedbackProgressComparisonProps = {
  cycles: {
    ratings: Partial<Record<FeedbackCriterion, number>>;
    evaluationStartsAt: string;
    evaluationEndsAt: string;
  }[];
};

export function FeedbackProgressComparison({
  cycles,
}: FeedbackProgressComparisonProps) {
  const [currentCycle, setCurrentCycle] = useState(0);
  const [previousCycle, setPreviousCycle] = useState(1);

  const currentRatings = cycles[currentCycle]?.ratings ?? {};
  const previousRatings = cycles[previousCycle]?.ratings ?? {};

  return (
    <section className="rounded-xl bg-muted/30 p-4">
      <h3 className="font-semibold">
        Feedback progress
      </h3>

      <div className="mt-4 flex flex-wrap gap-4 rounded-xl bg-muted/40 p-4 text-sm">
        <label className="flex items-center gap-2">
          Current cycle:
          <select
            value={currentCycle}
            onChange={(event) =>
              setCurrentCycle(Number(event.target.value))
            }
            className="rounded-xl border bg-card px-3 py-2 text-sm shadow-sm transition hover:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          >
            {cycles.map((_, index) => (
              <option key={index} value={index}>
                {formatCycleDate(cycles[index].evaluationStartsAt)}
                -
                {formatCycleDate(cycles[index].evaluationEndsAt)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          Compare with:
          <select
            value={previousCycle}
            onChange={(event) =>
              setPreviousCycle(Number(event.target.value))
            }
            className="rounded-xl border bg-card px-3 py-2 text-sm shadow-sm transition hover:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          >
            {cycles.map((_, index) => (
              <option key={index} value={index}>
                {formatCycleDate(cycles[index].evaluationStartsAt)}
                -
                {formatCycleDate(cycles[index].evaluationEndsAt)}
              </option>
            ))}
          </select>
        </label>
      </div>

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
    </section>
  );
}

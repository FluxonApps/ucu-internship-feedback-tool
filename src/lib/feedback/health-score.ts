import {
  feedbackMatrices,
  type FeedbackCriterion,
  type FeedbackRating,
} from "./definitions";

export type HealthScore = {
  softAverage: number;
  technicalAverage: number;
  overallAverage: number;
};

export function calculateHealthScore(
  ratings: Partial<Record<FeedbackCriterion, FeedbackRating>> | undefined,
): HealthScore {
  if (!ratings) {
    return {
      softAverage: 0,
      technicalAverage: 0,
      overallAverage: 0,
    };
  }

  function average(values: number[]) {
    if (!values.length) return 0;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  const softRatings = feedbackMatrices[0].criteria.flatMap((criterion) => {
    const rating = ratings[criterion.value];

    return rating === undefined ? [] : [rating];
  });

  const technicalRatings = feedbackMatrices[1].criteria.flatMap((criterion) => {
    const rating = ratings[criterion.value];

    return rating === undefined ? [] : [rating];
  });

  const softAverage = average(softRatings);
  const technicalAverage = average(technicalRatings);

  return {
    softAverage,
    technicalAverage,
    overallAverage: average([...softRatings, ...technicalRatings]),
  };
}

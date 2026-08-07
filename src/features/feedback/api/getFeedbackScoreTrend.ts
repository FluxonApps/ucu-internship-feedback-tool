import type { PublishedFeedbackDto } from "@/lib/feedback/types";

type FeedbackScoreTrendPoint = {
  cycle: string;
  score: number;
};

function calculateAverageScore(
  ratings: PublishedFeedbackDto["ratings"],
) {
  const values = Object.values(ratings);

  if (!values.length) {
    return undefined;
  }

  return values.reduce((sum, value) => sum + Number(value), 0) / values.length;
}

export async function getFeedbackScoreTrend(
  internshipId: string,
  internId: string,
): Promise<FeedbackScoreTrendPoint[]> {
  const { listInternPublishedFeedback } = await import(
    "@/server/feedback/service"
  );

  const publications = await listInternPublishedFeedback(
    internshipId,
    internId,
  );

  return publications
    .map((publication) => {
      const score = calculateAverageScore(publication.ratings);

      if (score === undefined) {
        return undefined;
      }

      return {
        cycle: new Date(
          publication.publishedAt,
        ).toLocaleDateString("en-GB"),
        score: Number(score.toFixed(1)),
      };
    })
    .filter(
      (item): item is FeedbackScoreTrendPoint =>
        item !== undefined,
    )
    .reverse();
}

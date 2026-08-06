import type { FeedbackCriterion } from "@/lib/feedback/definitions";
import type { PublishedFeedbackDto } from "@/lib/feedback/types";

type FeedbackProgressRatings = Partial<
  Record<FeedbackCriterion, number>
>;

export type FeedbackProgressComparisonDto = {
  cycles: {
    ratings: FeedbackProgressRatings;
    evaluationStartsAt: string;
    evaluationEndsAt: string;
  }[];
};

function getRatings(
  publication: PublishedFeedbackDto,
): FeedbackProgressRatings {
  return publication.ratings;
}

export async function getFeedbackProgressComparison(
  internshipId: string,
  internId: string,
): Promise<FeedbackProgressComparisonDto | undefined> {
  const publications = await listPublishedFeedback(internshipId, internId);

  if (publications.length < 2) {
    return undefined;
  }

  return {
    cycles: publications.map((publication) => ({
      ratings: getRatings(publication),
      evaluationStartsAt: publication.evaluationStartsAt,
      evaluationEndsAt: publication.evaluationEndsAt,
    })),
  };
}

async function listPublishedFeedback(
  internshipId: string,
  internId: string,
): Promise<PublishedFeedbackDto[]> {
  const { listInternPublishedFeedback } = await import(
    "@/server/feedback/service"
  );

  return listInternPublishedFeedback(internshipId, internId);
}

export type InternAnalyticsOverviewDto = {
  feedbackCycles: number;
  currentAverageScore?: number;
  progressTrend?: number;
};

function calculateAverageScore(
  ratings: PublishedFeedbackDto["ratings"],
) {
  const values = Object.values(ratings);

  if (!values.length) {
    return undefined;
  }

  return (
    values.reduce((sum, value) => sum + Number(value), 0) / values.length
  );
}

export async function getInternAnalyticsOverview(
  internshipId: string,
  internId: string,
): Promise<InternAnalyticsOverviewDto> {
  const publications = await listPublishedFeedback(
    internshipId,
    internId,
  );

  if (!publications.length) {
    return {
      feedbackCycles: 0,
    };
  }

  const current = calculateAverageScore(publications[0].ratings);

  const first = calculateAverageScore(
    publications[publications.length - 1].ratings,
  );

  return {
    feedbackCycles: publications.length,
    currentAverageScore: current
      ? Number(current.toFixed(1))
      : undefined,
    progressTrend:
      current !== undefined && first !== undefined
        ? Number((current - first).toFixed(1))
        : undefined,
  };
}

import type { FeedbackCriterion } from "@/lib/feedback/definitions";
import type { PublishedFeedbackDto } from "@/lib/feedback/types";

type FeedbackProgressRatings = Partial<
  Record<FeedbackCriterion, number>
>;

export type FeedbackProgressComparisonDto = {
  previous: FeedbackProgressRatings;
  current: FeedbackProgressRatings;
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

  const [current, previous] = publications;

  return {
    previous: getRatings(previous),
    current: getRatings(current),
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

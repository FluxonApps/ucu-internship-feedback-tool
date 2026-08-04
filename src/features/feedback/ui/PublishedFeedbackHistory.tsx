import type { PublishedFeedbackDto } from "@/lib/feedback/types";

import { FeedbackPublicationContent } from "./FeedbackPublicationContent";

const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC" });

export function PublishedFeedbackHistory({
  publications,
}: {
  publications: PublishedFeedbackDto[];
}) {
  if (!publications.length) {
    return (
      <div className="rounded-xl bg-muted/40 p-6 text-sm text-muted-foreground">
        No feedback has been published yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {publications.map((publication, index) => (
        <details
          key={publication.cycleId}
          open={index === 0}
          className="rounded-xl bg-muted/30 p-5"
        >
          <summary className="cursor-pointer font-semibold">
            {date(publication.evaluationStartsAt)} –{" "}
            {date(publication.evaluationEndsAt)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Published {date(publication.publishedAt)}
            </span>
          </summary>
          <div className="mt-5">
            <FeedbackPublicationContent publication={publication} />
          </div>
        </details>
      ))}
    </div>
  );
}

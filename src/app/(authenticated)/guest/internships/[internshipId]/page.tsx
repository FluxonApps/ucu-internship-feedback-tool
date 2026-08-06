import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PublishedFeedbackHistory } from "@/features/feedback/ui/PublishedFeedbackHistory";
import { requireGuestPage } from "@/server/feedback/page-auth";
import { listGuestPublishedFeedback } from "@/server/feedback/service";

import { HealthScoreSection } from "@/features/feedback/ui/HealthScoreSection";

export default async function GuestInternshipFeedbackPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  await requireGuestPage();
  const { internshipId } = await params;
  let publications;
  try {
    publications = await listGuestPublishedFeedback(internshipId);
  } catch {
    notFound();
  }
  if (!publications.length) notFound();

  const latestPublication = publications[0];

  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Published feedback", href: "/guest" },
            { label: publications[0].internDisplayName },
          ]}
        />
        <p className="text-sm font-medium text-[var(--brand-strong)]">
          Published feedback
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {publications[0].internDisplayName}
        </h1>
      </div>

      {latestPublication && (
        <HealthScoreSection publication={latestPublication} />
      )}

      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold">Feedback history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Published assessments and recommendations, newest first.
          </p>
        </div>
        <PublishedFeedbackHistory publications={publications} />
      </section>
    </section>
  );
}

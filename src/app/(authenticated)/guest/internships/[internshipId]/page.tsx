import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PublishedFeedbackHistory } from "@/features/feedback/ui/PublishedFeedbackHistory";
import { requireGuestPage } from "@/server/feedback/page-auth";
import { listGuestPublishedFeedback } from "@/server/feedback/service";
import Link from "next/link";;

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

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
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
        <Link
          href={`/analytics?internshipId=${internshipId}`}
          className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:border-[var(--brand)]"
        >
          View analytics
        </Link>
      </div>
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

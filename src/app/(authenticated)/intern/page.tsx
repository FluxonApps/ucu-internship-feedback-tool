import { Menu } from "@/components/ui/Menu";
import { requireInternPage } from "@/server/assignments/page-auth";
import { getCurrentInternshipForIntern } from "@/server/assignments/service";
import { PublishedFeedbackHistory } from "@/features/feedback/ui/PublishedFeedbackHistory";
import { listInternPublishedFeedback } from "@/server/feedback/service";
import Link from "next/link";

import { HealthScoreSection } from "@/features/feedback/ui/HealthScoreSection";

export default async function InternPage() {
  const context = await requireInternPage();
  const internship = await getCurrentInternshipForIntern(context.userId);
  const publications = internship
    ? await listInternPublishedFeedback(internship.id, context.userId)
    : [];
  const workspaceMenu = [
    { href: "#feedback", label: "Feedback" },
    { href: "#one-on-one-preparation", label: "1:1 Preparation" },
  ];

  const latestPublication = publications.length > 0 ? publications[0] : null;

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--brand-strong)]">
            Intern workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Intern dashboard
          </h1>
        </div>
        <Link
          href={
            internship
              ? `/analytics?internshipId=${internship.id}`
              : "#"
          }
          className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:border-[var(--brand)]"
        >
          View analytics
        </Link>
      </div>
      {internship ? (
        <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
          {/* Адаптивне зафіксоване меню без білої плашки */}
          <div className="sticky top-0 z-20 -mx-4 bg-[#f0f5f3]/90 px-4 py-3 backdrop-blur-md md:static md:z-auto md:m-0 md:p-0 md:bg-transparent md:backdrop-blur-none md:sticky md:top-24 md:self-start">
            <Menu
              items={workspaceMenu}
              label="Intern dashboard navigation"
              className="md:flex-col md:overflow-visible"
            />
          </div>

          {/* min-w-0 запобігає вилазинню контенту в грідах */}
          <div className="min-w-0 space-y-10">
            <section
              id="feedback"
              className="scroll-mt-24 min-w-0 overflow-hidden space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
            >
              <div>
                <h2 className="text-2xl font-semibold">Feedback</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review feedback that has been published for your internship.
                </p>
              </div>

              {latestPublication && (
                <HealthScoreSection publication={latestPublication} />
              )}

              <div className="space-y-4 rounded-2xl border bg-card p-6">
                <h3 className="text-lg font-semibold">Feedback History</h3>
                <PublishedFeedbackHistory publications={publications} />
              </div>
            </section>

            <section
              id="one-on-one-preparation"
              className="scroll-mt-24 min-w-0 overflow-hidden space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
            >
              <div>
                <h2 className="text-lg font-semibold">1:1 Preparation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prepare discussion points for your upcoming one-to-one meetings.
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 p-6 text-sm text-muted-foreground">
                One-to-one preparation will be added here.
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">No current internship</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your internship dashboard will be available when an active internship is
            assigned to you.
          </p>
        </div>
      )}
    </section>
  );
}

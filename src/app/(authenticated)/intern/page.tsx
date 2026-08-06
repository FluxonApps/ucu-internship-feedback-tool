import { Tabs } from "@base-ui/react/tabs";
import Link from "next/link";

import { requireInternPage } from "@/server/assignments/page-auth";
import { getCurrentInternshipForIntern } from "@/server/assignments/service";
import { PublishedFeedbackHistory } from "@/features/feedback/ui/PublishedFeedbackHistory";
import { listInternPublishedFeedback } from "@/server/feedback/service";
import { CasualFeedbackPanel } from "@/features/casual-feedback/ui/CasualFeedbackPanel";
import { listCasualFeedbackForIntern } from "@/server/casual-feedback/service";
import { AnalyticsPanel } from "@/features/feedback/ui/AnalyticsPanel";

import { getInternAchievements } from "@/server/achievements/service";
import { AchievementsList } from "@/features/achievements/ui/AchievementsList";
import { HealthScoreSection } from "@/features/feedback/ui/HealthScoreSection";

export default async function InternPage() {
  const context = await requireInternPage();
  const internship = await getCurrentInternshipForIntern(context.userId);

  let publications: Awaited<ReturnType<typeof listInternPublishedFeedback>> = [];
  let casualFeedback: Awaited<ReturnType<typeof listCasualFeedbackForIntern>> = [];
  let achievements: Awaited<ReturnType<typeof getInternAchievements>> = [];

  if (internship) {
    [publications, casualFeedback, achievements] = await Promise.all([
      listInternPublishedFeedback(internship.id, context.userId),
      listCasualFeedbackForIntern(internship.id, context.userId),
      getInternAchievements(internship.id),
    ]);
  }

  const workspaceMenu = [
    { href: "#feedback", label: "Feedback" },
    { href: "#casual-feedback", label: "Casual Feedback" },
    { href: "#achievements", label: "Achievements" },
    { href: "#analytics", label: "Analytics" },
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
          <h1 className="text-3xl font-semibold tracking-tight">Intern dashboard</h1>
        </div>
        <Link
          href={internship ? `/analytics?internshipId=${internship.id}` : "#"}
          className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:border-[var(--brand)]"
        >
          View analytics
        </Link>
      </div>

      {internship ? (
        <Tabs.Root defaultValue="feedback" className="min-w-0 space-y-6">
          <Tabs.List
            aria-label="Intern dashboard"
            activateOnFocus
            className="flex gap-7 overflow-x-auto border-b"
          >
            <Tabs.Tab
              value="feedback"
              className="-mb-px shrink-0 border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-[var(--brand)] data-[active]:text-[var(--brand-strong)]"
            >
              Feedback
            </Tabs.Tab>
            <Tabs.Tab
              value="casual-feedback"
              className="-mb-px shrink-0 border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-[var(--brand)] data-[active]:text-[var(--brand-strong)]"
            >
              Casual Feedback
            </Tabs.Tab>
            <Tabs.Tab
              value="achievements"
              className="-mb-px shrink-0 border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-[var(--brand)] data-[active]:text-[var(--brand-strong)]"
            >
              Achievements
            </Tabs.Tab>
            <Tabs.Tab
              value="one-on-one-preparation"
              className="-mb-px shrink-0 border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-[var(--brand)] data-[active]:text-[var(--brand-strong)]"
            >
              1:1 Preparation
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel
            value="feedback"
            keepMounted
            className="min-w-0 overflow-hidden space-y-4"
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
          </Tabs.Panel>

          <Tabs.Panel
            value="casual-feedback"
            keepMounted
            className="min-w-0 overflow-hidden space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
          >
            <div>
              <h2 className="text-lg font-semibold">Casual Feedback</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Informal notes your teammates have shared about your internship.
              </p>
            </div>
            <CasualFeedbackPanel
              internshipId={internship.id}
              notes={casualFeedback}
              canWrite={false}
            />
          </Tabs.Panel>

          <Tabs.Panel
            value="achievements"
            keepMounted
            className="min-w-0 overflow-hidden space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
          >
            <div>
              <h2 className="text-lg font-semibold">Achievements</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Achievements awarded during your internship.
              </p>
            </div>
            <AchievementsList achievements={achievements} />
          </Tabs.Panel>

          <Tabs.Panel
            value="one-on-one-preparation"
            keepMounted
            className="min-w-0 overflow-hidden space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
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
          </Tabs.Panel>
        </Tabs.Root>
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

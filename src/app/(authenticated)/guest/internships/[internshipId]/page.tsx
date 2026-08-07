import { notFound } from "next/navigation";
import { Tabs } from "@base-ui/react/tabs";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PublishedFeedbackHistory } from "@/features/feedback/ui/PublishedFeedbackHistory";
import { requireGuestPage } from "@/server/feedback/page-auth";
import { listGuestPublishedFeedback } from "@/server/feedback/service";
import { AnalyticsPanel } from "@/features/feedback/ui/AnalyticsPanel";

// 1. Імпортуємо сервіс завантаження ачівок та UI-компонент списку
import { getInternAchievements } from "@/server/achievements/service";
import { AchievementsList } from "@/features/achievements/ui/AchievementsList";

import { HealthScoreSection } from "@/features/feedback/ui/HealthScoreSection";

export default async function GuestInternshipFeedbackPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  await requireGuestPage();
  const { internshipId } = await params;

  let publications;
  let achievements;

  try {
    // 2. Паралельно отримуємо фідбеки та видані ачівки для даного інтерна
    [publications, achievements] = await Promise.all([
      listGuestPublishedFeedback(internshipId),
      getInternAchievements(internshipId),
    ]);
  } catch {
    notFound();
  }

  if (!publications.length) notFound();

  const latestPublication = publications[0];

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
      </div>

      <Tabs.Root defaultValue="feedback" className="min-w-0 space-y-6">
        <Tabs.List
          aria-label="Internship workspace"
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
            value="achievements"
            className="-mb-px shrink-0 border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-[var(--brand)] data-[active]:text-[var(--brand-strong)]"
          >
            Achievements
          </Tabs.Tab>
          <Tabs.Tab
            value="analytics"
            className="-mb-px shrink-0 border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-[var(--brand)] data-[active]:text-[var(--brand-strong)]"
          >
            Analytics
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="feedback" keepMounted className="min-w-0 overflow-hidden space-y-4">
          {latestPublication && (
            <HealthScoreSection publication={latestPublication} />
          )}

          <div className="space-y-4 rounded-2xl border bg-card p-6">
            <div>
              <h2 className="text-lg font-semibold">Feedback history</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Published assessments and recommendations, newest first.
              </p>
            </div>
            <PublishedFeedbackHistory publications={publications} />
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="achievements" keepMounted className="min-w-0 overflow-hidden space-y-4">
          {/* 3. Нова секція Achievements для гостей (тільки перегляд) */}
          <div>
            <h2 className="text-lg font-semibold">Achievements</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Achievements awarded during this internship.
            </p>
          </div>
          <AchievementsList achievements={achievements} />
        </Tabs.Panel>

        <Tabs.Panel value="analytics" keepMounted className="min-w-0 overflow-hidden space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Analytics
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Internship progress and feedback trends.
            </p>
          </div>

          <AnalyticsPanel
            internshipId={internshipId}
            internId={publications[0].internId}
          />
        </Tabs.Panel>
      </Tabs.Root>
    </section>
  );
}

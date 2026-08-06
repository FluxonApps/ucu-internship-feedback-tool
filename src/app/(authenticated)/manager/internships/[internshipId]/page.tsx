import { Tabs } from "@base-ui/react/tabs";
import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { AssignmentsPanel } from "@/features/assignments/ui/AssignmentsPanel";
import { ManagerFeedbackPanel } from "@/features/feedback/ui/ManagerFeedbackPanel";
import { AchievementsPanel } from "@/features/achievements/ui/AchievementsPanel";

import { requireManagerPage } from "@/server/assignments/page-auth";
import { getManagedInternshipDetail } from "@/server/assignments/service";
import { listManagerFeedbackCycles } from "@/server/feedback/service";
import {
  getAvailableAchievements,
  getInternAchievements,
} from "@/server/achievements/service";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  const { internshipId } = await params;
  const context = await requireManagerPage();

  const [detail, feedbackCycles, availableAchievements, internAchievements] =
    await Promise.all([
      getManagedInternshipDetail(internshipId, context.userId),
      listManagerFeedbackCycles(internshipId, context.userId),
      getAvailableAchievements(),
      getInternAchievements(internshipId),
    ]);

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumbs
            items={[
              { label: "Internships", href: "/manager/internships" },
              { label: detail.internship.internName },
            ]}
          />
          <p className="text-sm font-medium text-[var(--brand-strong)]">
            {detail.internship.status} internship
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {detail.internship.internName}
          </h1>
        </div>
        <Link
          href={`/analytics?internshipId=${internshipId}`}
          className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:border-[var(--brand)]"
        >
          View analytics
        </Link>
      </div>

      <Tabs.Root defaultValue="assignments" className="min-w-0 space-y-6">
        <Tabs.List
          aria-label="Internship workspace"
          activateOnFocus
          className="flex gap-7 overflow-x-auto border-b"
        >
          <Tabs.Tab
            value="assignments"
            className="-mb-px shrink-0 border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-[var(--brand)] data-[active]:text-[var(--brand-strong)]"
          >
            Assignments
          </Tabs.Tab>
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

        <Tabs.Panel value="assignments" keepMounted className="min-w-0 overflow-hidden">
          <AssignmentsPanel internshipId={internshipId} detail={detail} />
        </Tabs.Panel>

        <Tabs.Panel value="feedback" keepMounted className="min-w-0 overflow-hidden">
          <section>
            <ManagerFeedbackPanel internshipId={internshipId} cycles={feedbackCycles} />
          </section>
        </Tabs.Panel>

        <Tabs.Panel
          value="achievements"
          keepMounted
          className="min-w-0 overflow-hidden"
        >
          <AchievementsPanel
            internshipId={internshipId}
            availableAchievements={availableAchievements}
            internAchievements={internAchievements}
          />
        </Tabs.Panel>

        <Tabs.Panel value="analytics" keepMounted className="min-w-0 overflow-hidden">
          <p className="text-sm text-muted-foreground">To Do</p>
        </Tabs.Panel>
      </Tabs.Root>
    </section>
  );
}

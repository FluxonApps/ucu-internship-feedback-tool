import { Tabs } from "@base-ui/react/tabs";
import { redirect } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { requireTeammatePage } from "@/server/assignments/page-auth";
import { getTeammateInternshipDetail } from "@/server/assignments/service";
import { AuthorizationError } from "@/server/authorization/errors";
import { TeammateFeedbackPanel } from "@/features/feedback/ui/TeammateFeedbackPanel";
import { listTeammateFeedback } from "@/server/feedback/service";
import { CasualFeedbackPanel } from "@/features/casual-feedback/ui/CasualFeedbackPanel";
import { listCasualFeedbackForTeammate } from "@/server/casual-feedback/service";
import {
  getAvailableAchievements,
  getInternAchievements,
} from "@/server/achievements/service";
import { AchievementsPanel } from "@/features/achievements/ui/AchievementsPanel";

export default async function TeammateInternshipPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  const { internshipId } = await params;
  const context = await requireTeammatePage();

  let internship: Awaited<ReturnType<typeof getTeammateInternshipDetail>>;
  let feedback: Awaited<ReturnType<typeof listTeammateFeedback>>;
  let casualFeedback: Awaited<ReturnType<typeof listCasualFeedbackForTeammate>>;
  let availableAchievements: Awaited<ReturnType<typeof getAvailableAchievements>>;
  let internAchievements: Awaited<ReturnType<typeof getInternAchievements>>;

  try {
    [internship, feedback, casualFeedback, availableAchievements, internAchievements] =
      await Promise.all([
        getTeammateInternshipDetail(internshipId, context.userId),
        listTeammateFeedback(internshipId, context.userId),
        listCasualFeedbackForTeammate(internshipId, context.userId),
        getAvailableAchievements(),
        getInternAchievements(internshipId),
      ]);
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/forbidden");
    throw error;
  }

  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Internships", href: "/teammate" },
            { label: internship.internName },
          ]}
        />
        <p className="text-sm font-medium text-[var(--brand-strong)]">
          {internship.status} internship
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {internship.internName}
        </h1>
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
            value="casual-feedback"
            className="-mb-px shrink-0 border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-[var(--brand)] data-[active]:text-[var(--brand-strong)]"
          >
            Casual Feedback
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
            <h2 className="text-lg font-semibold">Feedback</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Give feedback for this intern&apos;s active feedback cycles.
            </p>
          </div>
          <TeammateFeedbackPanel internshipId={internshipId} feedback={feedback} />
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

        <Tabs.Panel
          value="casual-feedback"
          keepMounted
          className="min-w-0 overflow-hidden space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
        >
          <div>
            <h2 className="text-lg font-semibold">Casual Feedback</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Jot down a quick, informal note for a given date.
            </p>
          </div>
          <CasualFeedbackPanel
            internshipId={internshipId}
            notes={casualFeedback}
            canWrite
          />
        </Tabs.Panel>

        <Tabs.Panel
          value="one-on-one-preparation"
          keepMounted
          className="min-w-0 overflow-hidden space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
        >
          <div>
            <h2 className="text-lg font-semibold">1:1 Preparation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Prepare talking points for upcoming one-to-one meetings.
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-6 text-sm text-muted-foreground">
            One-to-one preparation will be added here.
          </div>
        </Tabs.Panel>
      </Tabs.Root>
    </section>
  );
}

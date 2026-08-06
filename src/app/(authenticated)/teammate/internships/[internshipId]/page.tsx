import { redirect } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Menu } from "@/components/ui/Menu";
import { requireTeammatePage } from "@/server/assignments/page-auth";
import { getTeammateInternshipDetail } from "@/server/assignments/service";
import { AuthorizationError } from "@/server/authorization/errors";
import { TeammateFeedbackPanel } from "@/features/feedback/TeammateFeedbackPanel";
import { listTeammateFeedback } from "@/server/feedback/service";
import { CasualFeedbackPanel } from "@/features/casual-feedback/ui/CasualFeedbackPanel";
import { listCasualFeedbackForTeammate } from "@/server/casual-feedback/service";

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
  try {
    [internship, feedback, casualFeedback] = await Promise.all([
      getTeammateInternshipDetail(internshipId, context.userId),
      listTeammateFeedback(internshipId, context.userId),
      listCasualFeedbackForTeammate(internshipId, context.userId),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/forbidden");
    throw error;
  }
  const workspaceMenu = [
    { href: "#feedback", label: "Feedback" },
    { href: "#casual-feedback", label: "Casual Feedback" },
    { href: "#one-on-one-preparation", label: "1:1 Preparation" },
  ];

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
      <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
        {/* Адаптивне зафіксоване меню без білої плашки */}
        <div className="sticky top-0 z-20 -mx-4 bg-[#f0f5f3]/90 px-4 py-3 backdrop-blur-md md:static md:z-auto md:m-0 md:p-0 md:bg-transparent md:backdrop-blur-none md:sticky md:top-24 md:self-start">
          <Menu
            items={workspaceMenu}
            label="Internship navigation"
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
              <h2 className="text-lg font-semibold">Feedback</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Give feedback for this intern&apos;s active feedback cycles.
              </p>
            </div>
            <TeammateFeedbackPanel internshipId={internshipId} feedback={feedback} />
          </section>

          <section
            id="casual-feedback"
            className="scroll-mt-24 min-w-0 overflow-hidden space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
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
          </section>

          <section
            id="one-on-one-preparation"
            className="scroll-mt-24 min-w-0 overflow-hidden space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
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
          </section>
        </div>
      </div>
    </section>
  );
}

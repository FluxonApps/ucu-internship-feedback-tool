import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Menu } from "@/components/ui/Menu";
import { requireInternPage } from "@/server/assignments/page-auth";
import { getCurrentInternshipForIntern } from "@/server/assignments/service";
import { PublishedFeedbackHistory } from "@/features/feedback/PublishedFeedbackHistory";
import { listInternPublishedFeedback } from "@/server/feedback/service";

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

  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <Breadcrumbs items={[{ label: "Intern dashboard" }]} />
        <p className="text-sm font-medium text-[var(--brand-strong)]">
          Intern workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Intern dashboard</h1>
      </div>
      {internship ? (
        <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
          <Menu
            items={workspaceMenu}
            label="Intern dashboard navigation"
            className="md:flex-col md:overflow-visible"
          />
          <div className="space-y-10">
            <section
              id="feedback"
              className="scroll-mt-24 space-y-4 rounded-2xl border bg-card p-6"
            >
              <div>
                <h2 className="text-lg font-semibold">Feedback</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review feedback that has been published for your internship.
                </p>
              </div>
              <PublishedFeedbackHistory publications={publications} />
            </section>
            <section
              id="one-on-one-preparation"
              className="scroll-mt-24 space-y-4 rounded-2xl border bg-card p-6"
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

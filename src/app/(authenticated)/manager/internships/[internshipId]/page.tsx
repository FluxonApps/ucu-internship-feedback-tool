import {
  AssignmentActions,
  TeammateAssignmentActions,
} from "@/features/assignments/AssignmentActions";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Menu } from "@/components/ui/Menu";
import { requireManagerPage } from "@/server/assignments/page-auth";
import { getManagedInternshipDetail } from "@/server/assignments/service";
import { ManagerFeedbackPanel } from "@/features/feedback/ManagerFeedbackPanel";
import { listManagerFeedbackCycles } from "@/server/feedback/service";

function dateLabel(value: { toDate(): Date } | undefined) {
  return value ? value.toDate().toLocaleDateString() : "Ongoing";
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  const { internshipId } = await params;
  const context = await requireManagerPage();
  const [detail, feedbackCycles] = await Promise.all([
    getManagedInternshipDetail(internshipId, context.userId),
    listManagerFeedbackCycles(internshipId, context.userId),
  ]);
  const currentPlacement =
    detail.placements.find((placement) => placement.current) ?? detail.placements[0];
  const assignments = currentPlacement
    ? detail.assignments.filter(
        (assignment) => assignment.teamId === currentPlacement.teamId,
      )
    : [];
  const workspaceMenu = [
    {
      href: "#assignments",
      label: "Assignments",
    },
    {
      href: "#feedback-cycles",
      label: "Feedback",
    },
  ];

  return (
    <section className="space-y-7">
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
      <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
        <Menu
          items={workspaceMenu}
          label="Internship navigation"
          className="md:flex-col md:overflow-visible"
        />
        <div className="space-y-10">
          <section
            id="assignments"
            className="scroll-mt-24 space-y-4 rounded-2xl border bg-card p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Assignments</h2>
                {currentPlacement ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentPlacement.teamTitle} · started{" "}
                    {dateLabel(currentPlacement.startsAt)}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No current Team Placement.
                  </p>
                )}
              </div>
              {currentPlacement ? (
                <AssignmentActions
                  internshipId={internshipId}
                  teamId={currentPlacement.teamId}
                  teamTitle={currentPlacement.teamTitle}
                  teammates={detail.teammates}
                />
              ) : null}
            </div>
            {assignments.length ? (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4"
                  >
                    <div className="grow">
                      <p className="font-medium">{assignment.teammateName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {assignment.responsibilities.join(", ") || "General teammate"} ·{" "}
                        {dateLabel(assignment.startsAt)} –{" "}
                        {dateLabel(assignment.endsAt)}
                      </p>
                    </div>
                    {assignment.status !== "ended" ? (
                      <TeammateAssignmentActions
                        internshipId={internshipId}
                        assignmentId={assignment.id}
                        responsibilities={assignment.responsibilities}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">Ended</span>
                    )}
                    {assignment.status === "scheduled" ? (
                      <span className="text-sm text-muted-foreground">Scheduled</span>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-muted/40 p-6 text-sm text-muted-foreground">
                No teammates assigned to the current Team yet.
              </div>
            )}
          </section>
          <section
            id="feedback-cycles"
            className="scroll-mt-24 space-y-4 rounded-2xl border bg-card p-6"
          >
            <ManagerFeedbackPanel internshipId={internshipId} cycles={feedbackCycles} />
          </section>
        </div>
      </div>
    </section>
  );
}

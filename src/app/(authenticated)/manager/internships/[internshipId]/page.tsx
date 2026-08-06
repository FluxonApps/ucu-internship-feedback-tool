import {
  AssignmentActions,
  TeammateAssignmentActions,
} from "@/features/assignments/ui/AssignmentAction";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Menu } from "@/components/ui/Menu";
import { requireManagerPage } from "@/server/assignments/page-auth";
import { getManagedInternshipDetail } from "@/server/assignments/service";
import { ManagerFeedbackPanel } from "@/features/feedback/ui/ManagerFeedbackPanel";
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
            id="assignments"
            className="scroll-mt-24 space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">Assignments</h2>
                {currentPlacement ? (
                  <p className="mt-1 text-sm text-muted-foreground truncate">
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
                <div className="shrink-0">
                  <AssignmentActions
                    internshipId={internshipId}
                    teamId={currentPlacement.teamId}
                    teamTitle={currentPlacement.teamTitle}
                    teammates={detail.teammates}
                  />
                </div>
              ) : null}
            </div>
            {assignments.length ? (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl bg-muted/40 p-3.5 sm:p-4"
                  >
                    {/* Контейнер тексту з автоскороченням */}
                    <div className="min-w-0 grow">
                      <p className="truncate font-medium break-all">{assignment.teammateName}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {assignment.responsibilities.join(", ") || "General teammate"} ·{" "}
                        {dateLabel(assignment.startsAt)} –{" "}
                        {dateLabel(assignment.endsAt)}
                      </p>
                    </div>

                    {/* Кнопка або статус закріплені праворуч */}
                    {assignment.status !== "ended" ? (
                      <div className="shrink-0">
                        <TeammateAssignmentActions
                          internshipId={internshipId}
                          assignmentId={assignment.id}
                          responsibilities={assignment.responsibilities}
                        />
                      </div>
                    ) : (
                      <span className="shrink-0 text-sm text-muted-foreground">Ended</span>
                    )}
                    {assignment.status === "scheduled" ? (
                      <span className="shrink-0 text-sm text-muted-foreground">Scheduled</span>
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

          {/* Додано min-w-0 та overflow-hidden для фіксу обрізання кнопок всередині компонента */}
          <section
            id="feedback-cycles"
            className="scroll-mt-24 min-w-0 overflow-hidden space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
          >
            <ManagerFeedbackPanel internshipId={internshipId} cycles={feedbackCycles} />
          </section>
        </div>
      </div>
    </section>
  );
}

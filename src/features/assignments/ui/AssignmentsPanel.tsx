import type { getManagedInternshipDetail } from "@/server/assignments/service";

import { AssignmentActions, TeammateAssignmentActions } from "./AssignmentAction";

type ManagedInternshipDetail = Awaited<ReturnType<typeof getManagedInternshipDetail>>;

function dateLabel(value: { toDate(): Date } | undefined) {
  return value ? value.toDate().toLocaleDateString() : "Ongoing";
}

export function AssignmentsPanel({
  internshipId,
  detail,
}: {
  internshipId: string;
  detail: ManagedInternshipDetail;
}) {
  const currentPlacement =
    detail.placements.find((placement) => placement.current) ?? detail.placements[0];
  const assignments = currentPlacement
    ? detail.assignments.filter(
        (assignment) => assignment.teamId === currentPlacement.teamId,
      )
    : [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Assignments</h2>
          {currentPlacement ? (
            <p className="mt-1 truncate text-sm text-muted-foreground">
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
              <div className="min-w-0 grow">
                <p className="truncate font-medium break-all">
                  {assignment.teammateName}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {assignment.responsibilities.join(", ") || "General teammate"} ·{" "}
                  {dateLabel(assignment.startsAt)} – {dateLabel(assignment.endsAt)}
                </p>
              </div>

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
                <span className="shrink-0 text-sm text-muted-foreground">
                  Scheduled
                </span>
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
  );
}

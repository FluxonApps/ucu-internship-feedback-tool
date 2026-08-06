import Link from "next/link";

import { requireGuestPage } from "@/server/feedback/page-auth";
import { listGuestPublishedInternships } from "@/server/feedback/service";

const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC" });

export default async function GuestDashboardPage() {
  await requireGuestPage();
  const internships = await listGuestPublishedInternships();

  return (
    <section className="space-y-7">
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--brand-strong)]">
          Guest workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Published internship feedback
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explore feedback that internship managers have published.
        </p>
      </div>
      {internships.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {internships.map((internship) => (
            <Link
              key={internship.internshipId}
              href={`/guest/internships/${internship.internshipId}`}
              className="rounded-2xl border bg-card p-5 shadow-sm transition hover:border-[var(--brand)]"
            >
              <p className="font-semibold">{internship.internDisplayName}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {internship.publishedCycleCount} published{" "}
                {internship.publishedCycleCount === 1 ? "cycle" : "cycles"} · Latest{" "}
                {date(internship.latestPublishedAt)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <h2 className="font-semibold">No published feedback yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Published internship feedback will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

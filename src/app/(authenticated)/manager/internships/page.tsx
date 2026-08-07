import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { CreateInternshipDialog } from "@/features/assignments/ui/CreateInternshipDialog";
import {
  listAvailableInterns,
  listManagedInternships,
} from "@/server/assignments/service";
import { requireManagerPage } from "@/server/assignments/page-auth";

export default async function ManagerInternshipsPage() {
  const context = await requireManagerPage();
  const [internships, interns] = await Promise.all([
    listManagedInternships(context.userId),
    listAvailableInterns(),
  ]);
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--brand-strong)]">
            Manager workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Internships</h1>
          <p className="mt-2 text-muted-foreground">
            Set up Teams and the teammates who support each intern.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/manager/people" />}
            variant="outline"
          >
            People &amp; Access
          </Button>
          <CreateInternshipDialog interns={interns} />
        </div>
      </div>
      {internships.length ? (
        <div className="grid gap-3">
          {internships.map((internship) => (
            <Link
              key={internship.id}
              href={`/manager/internships/${internship.id}`}
              className="rounded-2xl border bg-card p-5 shadow-sm transition hover:border-[var(--brand)]"
            >
              <p className="font-semibold">{internship.internName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {internship.status} internship · Manage assignments
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">No internships yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an internship after provisioning an intern in People &amp; Access.
          </p>
        </div>
      )}
    </section>
  );
}

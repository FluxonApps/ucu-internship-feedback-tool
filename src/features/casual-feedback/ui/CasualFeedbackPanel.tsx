import type { CasualFeedbackNoteDto } from "@/lib/casual-feedback/types";
import { CasualFeedbackForm } from "@/features/casual-feedback/ui/CasualFeedbackForm";
import { CasualFeedbackNoteCard } from "@/features/casual-feedback/ui/CasualFeedbackNoteCard";

export function CasualFeedbackPanel({
  internshipId,
  notes,
  canWrite,
}: {
  internshipId: string;
  notes: CasualFeedbackNoteDto[];
  canWrite: boolean;
}) {
  return (
    <div className="space-y-8">
      {canWrite ? <CasualFeedbackForm internshipId={internshipId} /> : null}

      <section className="space-y-3">
        <div>
          <h3 className="font-semibold">Past notes</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a date to read the note.
          </p>
        </div>

        {notes.length ? (
          notes.map((note) => <CasualFeedbackNoteCard key={note.id} note={note} />)
        ) : (
          <div className="rounded-xl bg-muted/40 p-6 text-sm text-muted-foreground">
            No casual feedback notes yet.
          </div>
        )}
      </section>
    </div>
  );
}

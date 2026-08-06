import type { CasualFeedbackNoteDto } from "@/lib/casual-feedback/types";

const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC" });

export function CasualFeedbackNoteCard({ note }: { note: CasualFeedbackNoteDto }) {
  return (
    <details className="rounded-xl bg-muted/40 p-4">
      <summary className="cursor-pointer font-medium">
        {date(note.date)}{" "}
        <span className="font-normal text-muted-foreground">
          — {note.authorDisplayName}
        </span>
      </summary>

      <div className="mt-3 text-sm whitespace-pre-wrap">{note.text}</div>
    </details>
  );
}

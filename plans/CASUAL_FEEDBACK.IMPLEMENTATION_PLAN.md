# Casual feedback — implementation plan

## Goal

Add a lightweight, date-stamped "casual feedback" note (a single free-text
poll) to an internship's workspace, positioned between the **Feedback** and
**1:1 Preparation** sections in both the teammate and intern workspace
navigation.

## Access model

| Role                                | Read | Write |
| ----------------------------------- | ---- | ----- |
| Teammate assigned to the internship | Yes  | Yes   |
| Intern of the internship            | Yes  | No    |
| Manager                             | No   | No    |
| Guest                               | No   | No    |

This mirrors the existing authorization pattern: every page and API route
checks its own role/assignment, and Firestore rules continue to deny all
browser access (`firestore.rules` already denies everything — no rule change
needed).

## Data model

New subcollection under each internship:

```
internships/{internshipId}/casualFeedbackNotes/{noteId}
  date: Timestamp            // the day the note is about (date-only, UTC midnight)
  text: string                // the free-text poll answer
  authorUserId: string
  authorDisplayNameSnapshot: string
  createdAt: Timestamp
  createdBy: string
  updatedAt: Timestamp
  updatedBy: string
```

Only assigned teammates can create notes (`requireAssignedTeammateInternship`,
mirroring `requireTeammateInternship`/`requireManagedInternship`). Interns can
only list notes for their own internship (mirrors
`listInternPublishedFeedback`'s ownership check).

## Server layer (`src/server/casual-feedback/`)

- `schemas.ts` — `createCasualFeedbackNoteInputSchema` (zod: `date`, `text`).
- `domain.ts` — `assertValidCasualFeedbackText`.
- `service.ts` — `listCasualFeedbackForTeammate`, `listCasualFeedbackForIntern`,
  `createCasualFeedbackNote`.
- `http.ts` — `requireCasualFeedbackMutationContext`,
  `casualFeedbackErrorResponse` (same shape as `src/server/feedback/http.ts`).

Page-level role gating reuses `requireTeammatePage`/`requireInternPage` from
`src/server/assignments/page-auth.ts`; no new page-auth module is needed.

## Shared DTOs (`src/lib/casual-feedback/types.ts`)

`CasualFeedbackNoteDto` — `id`, `date`, `text`, `authorDisplayName`,
`authorUserId`, `createdAt`.

## API routes

- `POST /api/teammate/internships/[internshipId]/casual-feedback` — create a
  note (assigned teammate only).

Reading happens through server components (same pattern as
`listTeammateFeedback` / `listInternPublishedFeedback`), so no GET route is
required.

## UI (`src/features/casual-feedback/`)

- `ui/CasualFeedbackPanel.tsx` — heading context, optional new-note form
  (`canWrite`), and the list of past notes rendered as `<details>` "tabs"
  (same accordion pattern as `FeedbackHistoryCard`).
- `ui/CasualFeedbackForm.tsx` — date selection + text poll + submit.
- `ui/CasualFeedbackNoteCard.tsx` — one collapsible past note.
- `api/createCasualFeedbackNote.ts` — client fetch helper.

## Page wiring

Both `src/app/(authenticated)/teammate/internships/[internshipId]/page.tsx`
and `src/app/(authenticated)/intern/page.tsx` gain:

- a `#casual-feedback` menu entry between `#feedback` and
  `#one-on-one-preparation`;
- a `<section id="casual-feedback">` in the same position, rendering
  `CasualFeedbackPanel` with `canWrite` true for teammates, false for interns.

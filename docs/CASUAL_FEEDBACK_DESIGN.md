# Casual Feedback — Design Doc

## What it is

A single free-text note per internship, where teammates can write informal
feedback about an intern. Separate from official feedback — no ratings, no
structure, no publishing step. Just one shared text box.

## Data model

One Firestore doc per internship — no query needed, just `doc().get()`:

```
casualFeedback/{internshipId}
```

| Field              | Type      | Notes                              |
| ------------------ | --------- | ----------------------------------- |
| `internshipId`     | string    | matches doc ID                     |
| `internId`         | string    | for authorization checks           |
| `text`             | string    | the note itself, max ~4000 chars   |
| `updatedAt`        | timestamp | server timestamp on every save     |
| `lastEditedBy`     | string    | uid                                 |
| `lastEditedByName` | string    | denormalized, for display          |

No document = no note yet. Deleting sets the doc back to absent rather than
storing an empty string.

Shared DTO in `src/lib/casual-feedback/types.ts`, per the repo's existing
convention, so client and server use the same shape.

## Access rule

- must be `active`
- must **not** have the `manager` role
- **teammates**: read + write, for any intern (no per-internship assignment
  restriction — it's org-wide)
- **the intern themself**: read only, own casual feedback only
- **guests**: no access

| Actor                     | Read | Write |
| -------------------------- | :--: | :---: |
| Guest                      | ❌   | ❌    |
| Manager                    | ❌   | ❌    |
| Intern (own note)          | ✅   | ❌    |
| Teammate                   | ✅   | ✅    |

As with the rest of the app, Firestore rules stay deny-all; enforcement is
entirely in a server-side check, called before any read or write:


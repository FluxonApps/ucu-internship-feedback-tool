# Casual Feedback — Design Doc

## What it is

A short free-text note that a mentor/teammate writes about an intern they're
assigned to. Separate from official feedback — no ratings, no structure, no
publishing step.

## Data model

Doc ID is the internship ID itself, so a lookup is `doc(internshipId).get()`
— a direct read by a known key, not a `where()` query. The internship ID is
already in hand wherever this is called from (it's on the page/route the
user is looking at), so there's nothing to search for.

```
casualFeedback/{internshipId}
```

| Field           | Type      | Notes                                                                 |
| ---------------- | --------- | ---------------------------------------------------------------------|
| `internshipId`/ `internId`  | string    | matches the doc ID — this specific placement of the intern with a team |
| `text`           | string    | the note itself, max ~4000 chars                                     |
| `createdAt`      | timestamp | server timestamp, set once                                           |
| `createdBy`      | string    | uid of the mentor/teammate who wrote it                              |
| `createdByName`  | string    | denormalized, for display                                            |

## Access rule

Allow-list, not a deny-list — default is no access, and each role that
should have access is granted explicitly:

Everyone not explicitly granted above — managers, guests, teammates who
aren't assigned to this internship, other interns — is denied by falling
through, not by name-checking a role to exclude.

| Actor                                | Read | Write |
| -------------------------------------- | :--: | :---: |
| Guest                                  | ❌   | ❌    |
| Manager                                | ❌   | ❌    |
| Intern (own note)                      | ✅   | ❌    |
| Assigned mentor/teammate               | ✅   | ✅   |

As with the rest of the app, Firestore rules stay deny-all; enforcement is
entirely in a server-side check, called before any read or write.

# Firestore data model

This document is a collection-level map. The canonical, executable document
schemas live in feature-scoped `models.ts` files; do not duplicate their field
definitions here.

## Assignments

Canonical models: [`src/server/assignments/models.ts`](../src/server/assignments/models.ts)

```text
users/{userId}
teams/{teamId}
internships/{internshipId}
  managerAssignments/{managerUserId}
  teamPlacements/{placementId}
  teammateAssignments/{assignmentId}
```

| Collection            | Canonical model                             | Purpose                                                              |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `users`               | `AppUser` in `src/server/users/app-user.ts` | Application access, global roles, and linked Firebase identity.      |
| `teams`               | `TeamDocument`                              | Lightweight titled team reference data.                              |
| `internships`         | `InternshipDocument`                        | An intern's dated internship and published-feedback summary fields.  |
| `managerAssignments`  | `ManagerAssignmentDocument`                 | Manager scope for one internship.                                    |
| `teamPlacements`      | `TeamPlacementDocument`                     | Dated internship-to-team history.                                    |
| `teammateAssignments` | `TeammateAssignmentDocument`                | Dated teammate-to-internship/team relationship and responsibilities. |

`endsAt` is inclusive. An absent `endsAt` means the placement or assignment is
ongoing. Assignment documents are not deleted; ending one preserves historical
read access.

## Feedback

ToDo

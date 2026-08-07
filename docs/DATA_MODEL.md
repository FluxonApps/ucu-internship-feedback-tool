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

Canonical models: [`src/server/feedback/models.ts`](../src/server/feedback/models.ts)

```text
internships/{internshipId}
  feedbackCycles/{cycleId}
    reviewers/{reviewerUserId}
    responses/{reviewerUserId}
```

| Collection       | Canonical model            | Purpose                                                                                                |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `feedbackCycles` | `FeedbackCycleDocument`    | Defines the timeline, custom questions manager metadata, and current state of feedback cycle.          |
| `reviewers`      | `FeedbackReviewerDocument` | Tracks an individual teammate's participation status and historical responsibilities during the cycle. |
| `responses`      | `FeedbackResponseDocument` | Stores the actual submitted feedback ratings, positive/constructive texts, and custom answers.         |

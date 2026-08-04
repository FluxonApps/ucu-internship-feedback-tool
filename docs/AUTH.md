# Authentication & authorization

How sign-in and access control work in the Internship Dashboard.

## The two jobs

- **Authentication** — who is this person? Handled by Firebase Auth.
- **Authorization** — what are they allowed to do? Handled by our own server
  code, on every page and every request.

One important fact that shapes everything below: the browser never talks to
the database directly. Firestore rules deny all access from the client. Every
read and write goes through our Next.js server, using an admin connection
that bypasses those rules. That means **all access control lives in our
application code** — there's no database-level backup if we get it wrong.

## Authentication: how sign-in works

1. User signs in through Firebase (Google, or a test persona locally).
2. The client sends Firebase's token to our own server.
3. Our server checks the request is really coming from our app, then verifies
   the token with Firebase and checks the account is legitimate (verified
   email, trusted sign-in method).
4. If everything checks out, our server creates a **session cookie** and
   sends it back to the browser.
5. From then on, that cookie is what proves who the user is — the server
   re-checks it on every request.

The cookie is set as `httpOnly`, meaning JavaScript in the browser can't read
it — only the server can, which protects it from a common style of attack.

## Local development vs. production

We run in two modes, controlled by one environment setting:

| | Local development | Production |
|---|---|---|
| Sign-in options | Google, plus 4 test personas (manager, mentor, intern, guest) with a shared test password | Google only |
| Who can use it | Developers, on their own machines | Real users |
| Firebase project | A separate development project | The real project |

The test personas only work against the development Firebase project, and
the app **refuses to even start** if development mode is accidentally
combined with a production environment. That's a deliberate safeguard —
there's no way for the test sign-in path to end up live.

## Authorization: how access is checked

Once someone is signed in, we look them up in our own user list and put them
into one of three buckets:

- **Guest** — signed in, but not a recognized user of the app yet.
- **Disabled** — a recognized user whose account has been turned off.
- **Active user** — a recognized, active user. This is the only group that
  has **roles**.

Roles are: `manager`, `intern`, `teammate`. A person can hold more than one.
Roles are independent of each other — having the `manager` role doesn't
automatically grant `teammate` or `intern` access. Each page checks for the
specific role it needs.

## How a page enforces this

Every page that should be restricted checks two things before showing
anything: is this person signed in, and do they have the right role? If
either check fails, the user is redirected — to a sign-in screen if they're
not authenticated, or to a generic "access not granted" page if they're
signed in but lack the right role.

That "access not granted" page doesn't say *which* role was
missing, so someone poking around a page they shouldn't see doesn't learn
anything about what roles exist or what they're missing.

There's no single gatekeeper file that checks every page at once — each page
is responsible for calling its own check. This keeps things simple and easy
to read one page at a time, but it also means a new page could in theory be
added without a check being wired up. Worth a process discussion: how do we
make sure that never slips through review?

## Creating the first manager

There's currently no in-app way to create the very first manager account —
it's done by hand, directly in Firebase, following a setup doc. This avoids
having any built-in path that could be used to self-promote to manager, but
it also means onboarding a brand-new manager today needs a manual step
outside the app.

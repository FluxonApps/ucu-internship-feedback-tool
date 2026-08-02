# Fluxon Internship Dashboard — Development Setup

Status: Implemented for `0.0.1`  
Last updated: 2026-07-27

## Decision

Everyday development uses a dedicated, hosted Firebase development project.
There are no Firebase emulators and no Java requirement.

The development project uses Firebase email/password authentication for
deterministic test identities. Production uses verified Google sign-in only.
Both environments use the same Firestore document shapes, server repositories,
session handling, and role authorization.

## One-time Firebase development project setup

Follow [INITIAL_SETUP.md](./INITIAL_SETUP.md). It covers the Firebase project,
Web App configuration, Email/Password provider, default Firestore database,
and development service-account key.

## Local configuration

```bash
cp .env.example .env.local
```

Fill in every Firebase Web App value, the development project ID, and the
absolute service-account key path. Keep both authentication mode variables as
`email-password-development`.

```dotenv
APP_ORIGIN=http://localhost:3000
NEXT_PUBLIC_AUTHENTICATION_MODE=email-password-development
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_AUTHENTICATION_MODE=email-password-development
FIREBASE_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/outside-the-repository/development-service-account.json
```

## Start and seed

```bash
npm install
npm run seed:development
npm run dev
```

The seed command is idempotent. It creates real Firebase Auth accounts and
real Firestore `users` documents in the development project:

| Persona | Firebase UID          | Email                 | Application access |
| ------- | --------------------- | --------------------- | ------------------ |
| Manager | `development-manager` | `manager@example.com` | `manager`          |
| Mentor  | `development-mentor`  | `mentor@example.com`  | `teammate`         |
| Intern  | `development-intern`  | `intern@example.com`  | `intern`           |
| Guest   | `development-guest`   | `guest@example.com`   | No user document   |

All seeded identities use the local development password embedded in the
development sign-in screen. It is not accepted in production.

## Authentication and data boundaries

1. The browser signs in through Firebase Auth.
2. The browser exchanges its Firebase ID token for an HTTP-only session cookie.
3. Next.js verifies the session and resolves application roles from Firestore.
4. All application data reads and writes go through Next.js and the Firebase
   Admin SDK.

The browser never reads or writes Firestore directly. `firestore.rules`
denies all browser access.

## Testing

`npm test` and CI need only Node.js.

`npm run test:integration` and `npm run test:e2e` target the configured
development Firebase project and may write deterministic test records. Run them
only against that dedicated project; `seed:development` refuses to run
unless development password mode is enabled.

## Production safety

- `email-password-development` is rejected when `NODE_ENV=production`.
- Client and server authentication mode values must match.
- Client and server Firebase project IDs must match.
- Production App Hosting sets both modes to `google`.
- Production session mutations require the configured canonical `APP_ORIGIN`.
- A guest has no application-user record and cannot receive role access.

# Fluxon Internship Dashboard

Starter version `0.0.1` establishes the shared Next.js, Firebase authentication, server authorization, and testing foundation for the internship dashboard.

Business features such as internships, assignments, feedback cycles, and publishing are intentionally not implemented yet.

## Requirements

- Node.js `22.13.0` or a compatible version listed in `package.json`
- npm

With nvm:

```bash
nvm install
nvm use
```

## Local setup

Install dependencies and copy the documented local configuration:

```bash
npm install
cp .env.example .env.local
```

Configure a dedicated Firebase development project as described in
[Initial Firebase setup](./docs/INITIAL_SETUP.md), then seed its deterministic
test users and start Next.js:

```bash
npm run seed:development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Development sign-in offers
manager, mentor, intern, and guest personas backed by real Firebase Auth and
Firestore records in the development project.

## Access model

- Production accepts any verified Google identity in the `0.x` releases; development uses the seeded email/password identities.
- An authenticated identity without an application-user record receives guest access.
- Application-user records may contain the `manager`, `intern`, and `teammate` roles.
- Inactive application users receive no role-specific access.
- The browser never accesses Firestore directly.
- Next.js reads and writes Firestore through the Firebase Admin SDK.
- Firestore Security Rules deny every browser read and write.

## First manager in a real Firebase project

Bootstrap the first manager through Firebase Console:

1. Enable Google under Authentication → Sign-in method.
2. Ask the intended manager to sign in once.
3. In Authentication → Users, copy the manager's Firebase UID and verified email.
4. In Firestore, create a document under `users` using an auto-generated document ID.
5. Add these fields with the indicated Firestore types:

| Field           | Firestore type | Value                              |
| --------------- | -------------- | ---------------------------------- |
| `email`         | string         | Verified email from Authentication |
| `displayName`   | string         | Manager's display name             |
| `active`        | boolean        | `true`                             |
| `roles`         | array          | One string value: `manager`        |
| `identityState` | string         | `linked`                           |
| `identities`    | array          | One map described below            |
| `createdAt`     | timestamp      | Current timestamp                  |
| `updatedAt`     | timestamp      | Current timestamp                  |

The map inside `identities` contains:

| Field      | Firestore type | Value                         |
| ---------- | -------------- | ----------------------------- |
| `provider` | string         | `firebase`                    |
| `subject`  | string         | Firebase UID copied in step 3 |

No application screen can create or promote the first manager.

## Real Firebase configuration

For a conventional environment, copy the Firebase web-app values into `.env.local`:

```dotenv
APP_ORIGIN=https://dashboard.example.com
NEXT_PUBLIC_AUTHENTICATION_MODE=google
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

FIREBASE_PROJECT_ID=
FIREBASE_AUTHENTICATION_MODE=google
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/outside-the-repository/service-account.json
```

`APP_ORIGIN` must be the deployment's canonical HTTPS origin; session mutation requests from every other origin are rejected. Replace the placeholder in `apphosting.yaml` before deployment.

Do not commit `.env.local` or service-account files. Firebase App Hosting provides web and Admin SDK configuration automatically, so deployed App Hosting environments do not require a service-account key.

## Commands

| Command                            | Purpose                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`                      | Start Next.js development                                                  |
| `npm run build`                    | Create the production build                                                |
| `npm run lint`                     | Run ESLint                                                                 |
| `npm run typecheck`                | Run TypeScript checks                                                      |
| `npm test`                         | Run unit tests                                                             |
| `npm run test:integration`         | Run integration tests against the configured development Firebase project  |
| `npm run test:e2e`                 | Run the browser smoke suite                                                |
| `npm run seed:development`         | Seed deterministic development identities and users                        |
| `npm run deploy:firestore-indexes` | Deploy repository-managed Firestore indexes using `.env.local` credentials |
| `npm run validate`                 | Run lint, type-check, unit tests, and build                                |

## Documentation

- [Initial Firebase setup](./docs/INITIAL_SETUP.md)
- [Local development](./docs/DEVELOPMENT.md)

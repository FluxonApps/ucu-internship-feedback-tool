# Fluxon Internship Dashboard — Initial Firebase Setup

Complete this once before running the application against a new Firebase
development project.

Use a dedicated development project. Do not use the production Firebase project
for local development, seeded test users, or automated tests.

## 1. Create the development project

1. In the Firebase Console, create a new project for development.
2. Register a **Web app** in that project. Do not enable Firebase Hosting for
   this local setup.
3. In Project settings → General → Your apps, open the Web app's **Config**
   snippet and keep these three values ready:

   - `apiKey`
   - `authDomain`
   - `projectId`

The web API key is public configuration, not a secret.

## 2. Enable Firebase Authentication

1. Open Build → Authentication.
2. Select **Get started** if Authentication has not been initialized.
3. Open Sign-in method.
4. Enable **Email/Password** and save.

Email/password is used only by the development project for deterministic test
identities. Production uses Google sign-in.

## 3. Create Firestore

1. Open Build → Firestore Database.
2. Select **Create database**.
3. Create the default database, named **(default)**.
4. Select the intended development region.
5. Choose Production mode.

The application reads and writes Firestore only through the Next.js server and
Firebase Admin SDK. Browser Firestore access remains denied by
`firestore.rules`.

## 4. Create a development service-account key

1. Open Project settings → Service accounts.
2. Select **Generate new private key**.
3. Save the JSON file outside this repository.
4. Confirm the JSON file's `project_id` matches the development Firebase
   project ID.

Treat this file as a credential: do not commit, share, or copy it into the
repository.

## 5. Configure the application

Copy the template:

```bash
cp .env.example .env.local
```

Fill in the values from the preceding steps:

```dotenv
APP_ORIGIN=http://localhost:3000

NEXT_PUBLIC_AUTHENTICATION_MODE=email-password-development
NEXT_PUBLIC_FIREBASE_API_KEY=your-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-development-project-id

FIREBASE_AUTHENTICATION_MODE=email-password-development
FIREBASE_PROJECT_ID=your-development-project-id
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/development-service-account.json
```

The client and server project IDs must be identical. The two authentication mode
values must also match.

## 6. Seed and run

```bash
npm run seed:development
npm run dev
```

Open http://localhost:3000/sign-in and choose **Authenticate as manager**,
**mentor**, **intern**, or **guest**. The seed command creates actual Firebase
Auth accounts, Firestore `users` documents, and a manager-owned sample
internship with its Team and mentor assignment in the development project.
It is safe to run again.

## Firestore indexes

Required Firestore composite and single-field collection-group indexes are
versioned in [`firestore.indexes.json`](../firestore.indexes.json). Deploy them
whenever a Firebase project is set up or updated:

```bash
npm run deploy:firestore-indexes
```

The command reads `FIREBASE_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS`
from `.env.local` and calls the Firestore Admin API with that service account.
That service account needs the **Cloud Datastore Index Admin** IAM role
(`roles/datastore.indexAdmin`) in the Firebase project's Google Cloud IAM
settings.

Index builds are asynchronous. Wait until the Firebase Console shows the index
as enabled before exercising the manager internship list.

## Production setup

Production is a separate Firebase project. Enable Google authentication there
and configure Firebase App Hosting with:

```yaml
NEXT_PUBLIC_AUTHENTICATION_MODE: google
FIREBASE_AUTHENTICATION_MODE: google
```

The application rejects development email/password mode when running in
production.

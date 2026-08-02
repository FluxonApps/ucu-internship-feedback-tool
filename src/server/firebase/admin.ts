import "server-only";

import { applicationDefault, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { getServerEnvironment } from "@/lib/env/server";

const environment = getServerEnvironment();

const adminApp = getApps().length
  ? getApp()
  : initializeApp({
      credential: applicationDefault(),
      projectId: environment.projectId,
    });

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);

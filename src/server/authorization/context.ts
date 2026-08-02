import "server-only";

import { cache } from "react";

import type { AuthenticatedUser } from "@/server/auth/types";
import {
  findAppUserByFirebaseUid,
  linkPendingAppUser,
} from "@/server/repositories/app-users";
import type { AppUser } from "@/server/users/app-user";

export type AuthorizationContext =
  | {
      access: "guest";
      user: AuthenticatedUser;
    }
  | {
      access: "disabled";
      user: AuthenticatedUser;
      userId: string;
      appUser: AppUser;
    }
  | {
      access: "appUser";
      user: AuthenticatedUser;
      userId: string;
      appUser: AppUser;
    };

export const getAuthorizationContext = cache(async function getContext(
  user: AuthenticatedUser,
): Promise<AuthorizationContext> {
  const appUserRecord =
    (await findAppUserByFirebaseUid(user.uid)) ??
    (await linkPendingAppUser(user.uid, user.email));

  if (!appUserRecord) {
    return {
      access: "guest",
      user,
    };
  }

  if (!appUserRecord.data.active) {
    return {
      access: "disabled",
      user,
      userId: appUserRecord.id,
      appUser: appUserRecord.data,
    };
  }

  return {
    access: "appUser",
    user,
    userId: appUserRecord.id,
    appUser: appUserRecord.data,
  };
});

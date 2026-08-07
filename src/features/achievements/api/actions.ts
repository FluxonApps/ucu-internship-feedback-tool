"use server";

import { revalidatePath } from "next/cache";
import {
  assignAchievementToIntern,
  createCustomAchievement,
} from "@/server/achievements/service";
import { requireManagerPage, requireTeammatePage } from "@/server/assignments/page-auth";

interface GiveAchievementInput {
  internId: string;
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  pathToRevalidate: string;
}

interface CreateAndAssignCustomAchievementInput {
  internId: string;
  title: string;
  description: string;
  icon: string;
  pathToRevalidate: string;
}

async function getAuthorizedUser() {
  try {
    return await requireManagerPage();
  } catch {
    try {
      return await requireTeammatePage();
    } catch {
      throw new Error("Only managers and teammates are allowed to manage achievements.");
    }
  }
}

export async function giveAchievementAction(input: GiveAchievementInput) {
  try {
    const currentUser = await getAuthorizedUser();

    await assignAchievementToIntern({
      internId: input.internId,
      givenByUserId: currentUser.userId,
      achievement: {
        achievementId: input.achievementId,
        title: input.title,
        description: input.description,
        icon: input.icon,
      },
    });

    revalidatePath(input.pathToRevalidate);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to give achievement",
    };
  }
}

export async function createAndAssignCustomAchievementAction(
  input: CreateAndAssignCustomAchievementInput
) {
  try {
    const currentUser = await getAuthorizedUser();

    const customAchievement = await createCustomAchievement({
      title: input.title,
      description: input.description,
      icon: input.icon,
    });

    await assignAchievementToIntern({
      internId: input.internId,
      givenByUserId: currentUser.userId,
      achievement: {
        achievementId: customAchievement.id,
        title: customAchievement.title,
        description: customAchievement.description,
        icon: customAchievement.icon,
      },
    });

    revalidatePath(input.pathToRevalidate);

    return { success: true, achievement: customAchievement };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create custom achievement",
    };
  }
}

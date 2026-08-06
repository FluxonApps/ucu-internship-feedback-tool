"use server";

import { revalidatePath } from "next/cache";
import { assignAchievementToIntern } from "@/server/achievements/service";
import { requireManagerPage, requireTeammatePage } from "@/server/assignments/page-auth";

interface GiveAchievementInput {
  internId: string;
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  pathToRevalidate: string;
}

export async function giveAchievementAction(input: GiveAchievementInput) {
  try {
    let currentUser: { userId: string } | null = null;

    try {
      currentUser = await requireManagerPage();
    } catch {
      try {
        currentUser = await requireTeammatePage();
      } catch {
        return {
          success: false,
          error: "Only managers and teammates are allowed to give achievements.",
        };
      }
    }

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

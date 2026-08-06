"use server";

import { revalidatePath } from "next/cache";
import { assignAchievementToIntern } from "@/server/achievements/service";
import { requireManagerPage } from "@/server/assignments/page-auth";

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
    const context = await requireManagerPage();

    await assignAchievementToIntern({
      internId: input.internId,
      givenByUserId: context.userId,
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

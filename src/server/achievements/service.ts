import { adminFirestore as db } from "@/server/firebase/admin";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isCustom: boolean;
}

export interface InternAchievement {
  id?: string;
  internId: string;
  givenByUserId: string;
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  createdAt: string;
}

export const DEFAULT_ACHIEVEMENTS: Omit<Achievement, "id">[] = [
  {
    title: "First PR Merged",
    description: "Successfully merged the first pull request",
    icon: "git-merge",
    isCustom: false,
  },
  {
    title: "Onboarding Finished",
    description: "Completed all initial onboarding tasks",
    icon: "check-circle",
    isCustom: false,
  },
  {
    title: "First Client Demo",
    description: "Presented completed work on a client demo",
    icon: "presentation",
    isCustom: false,
  },
  {
    title: "Bug Hunter",
    description: "Found and fixed a critical bug",
    icon: "bug",
    isCustom: false,
  },
];

export async function getAvailableAchievements(): Promise<Achievement[]> {
  const snapshot = await db.collection("achievements").get();

  if (snapshot.empty) {
    const createdAchievements: Achievement[] = [];
    for (const item of DEFAULT_ACHIEVEMENTS) {
      const docRef = await db.collection("achievements").add(item);
      createdAchievements.push({ id: docRef.id, ...item });
    }
    return createdAchievements;
  }

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Achievement, "id">),
  }));
}

export async function assignAchievementToIntern(params: {
  internId: string;
  givenByUserId: string;
  achievement: { title: string; description: string; icon: string; achievementId: string };
}) {
  const existingDoc = await db
    .collection("intern_achievements")
    .where("internId", "==", params.internId)
    .where("achievementId", "==", params.achievement.achievementId)
    .get();

  if (!existingDoc.empty) {
    throw new Error("This achievement has already been awarded to this intern.");
  }

  const newInternAchievement: Omit<InternAchievement, "id"> = {
    internId: params.internId,
    givenByUserId: params.givenByUserId,
    achievementId: params.achievement.achievementId,
    title: params.achievement.title,
    description: params.achievement.description,
    icon: params.achievement.icon,
    createdAt: new Date().toISOString(),
  };

  const docRef = await db.collection("intern_achievements").add(newInternAchievement);
  return { id: docRef.id, ...newInternAchievement };
}

export async function getInternAchievements(internId: string): Promise<InternAchievement[]> {
  const snapshot = await db
    .collection("intern_achievements")
    .where("internId", "==", internId)
    .get();

  const achievements = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<InternAchievement, "id">),
  }));

  return achievements.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

import { GiveAchievementModal } from "@/features/achievements/ui/GiveAchievementModal";
import { AchievementsList } from "@/features/achievements/ui/AchievementsList";
import type { Achievement, InternAchievement } from "@/server/achievements/service";

interface AchievementsPanelProps {
  internshipId: string;
  availableAchievements: Achievement[];
  internAchievements: InternAchievement[];
}

export function AchievementsPanel({
  internshipId,
  availableAchievements,
  internAchievements,
}: AchievementsPanelProps) {
  const alreadyAwardedIds = internAchievements.map(
    (item) => item.achievementId ?? item.id
  );

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Achievements</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recognize and track the intern's milestones.
          </p>
        </div>

        <GiveAchievementModal
          internId={internshipId}
          availableAchievements={availableAchievements}
          alreadyAwardedIds={alreadyAwardedIds}
        />
      </div>

      <AchievementsList achievements={internAchievements} />
    </section>
  );
}

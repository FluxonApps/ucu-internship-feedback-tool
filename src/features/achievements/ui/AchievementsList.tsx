"use client";

import { Award, Calendar } from "lucide-react";
import type { InternAchievement } from "@/server/achievements/service";

interface AchievementsListProps {
  achievements: InternAchievement[];
}

export function AchievementsList({ achievements }: AchievementsListProps) {
  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
          <Award className="h-6 w-6" />
        </div>
        <p className="font-medium text-foreground">No achievements yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Award the intern for their milestones and success!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((item) => {
        const formattedDate = new Date(item.createdAt).toLocaleDateString("uk-UA", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        return (
          <div
            key={item.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/80 border-t border-border/50 pt-2.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

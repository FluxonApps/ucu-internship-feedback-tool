"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Award, Plus, Check } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { giveAchievementAction } from "../api/actions";
import type { Achievement } from "@/server/achievements/service";

interface GiveAchievementModalProps {
  internId: string;
  availableAchievements: Achievement[];
}

export function GiveAchievementModal({
  internId,
  availableAchievements,
}: GiveAchievementModalProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();

  const handleGive = async (closeModal: () => void) => {
    if (!selectedAchievement) return;

    setIsSubmitting(true);
    setError(null);

    const result = await giveAchievementAction({
      internId,
      achievementId: selectedAchievement.id,
      title: selectedAchievement.title,
      description: selectedAchievement.description,
      icon: selectedAchievement.icon,
      pathToRevalidate: pathname,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSelectedAchievement(null);
      closeModal();
    } else {
      setError(result.error || "Failed to give achievement");
    }
  };

  return (
    <Modal
      trigger={
        <Button type="button">
          <Plus data-icon="inline-start" /> Give achievement
        </Button>
      }
      title="Give Achievement"
      description="Select an achievement to award to this intern."
    >
      {(close) => (
        <div className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Список ачівок для вибору */}
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {availableAchievements.map((item) => {
              const isSelected = selectedAchievement?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedAchievement(item)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-accent shadow-sm"
                      : "border-border bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedAchievement(null);
                close();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleGive(close)}
              disabled={!selectedAchievement || isSubmitting}
            >
              {isSubmitting ? "Giving..." : "Give"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

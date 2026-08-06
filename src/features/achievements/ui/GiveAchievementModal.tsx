"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Award,
  Plus,
  Check,
  Trophy,
  Star,
  Zap,
  Flame,
  Target,
  Sparkles,
  Smile,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  giveAchievementAction,
  createAndAssignCustomAchievementAction,
} from "../api/actions";
import type { Achievement } from "@/server/achievements/service";

const ICON_OPTIONS = [
  { id: "award", icon: Award, label: "Award" },
  { id: "trophy", icon: Trophy, label: "Trophy" },
  { id: "star", icon: Star, label: "Star" },
  { id: "zap", icon: Zap, label: "Zap" },
  { id: "flame", icon: Flame, label: "Flame" },
  { id: "target", icon: Target, label: "Target" },
  { id: "sparkles", icon: Sparkles, label: "Sparkles" },
  { id: "smile", icon: Smile, label: "Smile" },
];

interface GiveAchievementModalProps {
  internId: string;
  availableAchievements: Achievement[];
  alreadyAwardedIds?: string[];
}

export function GiveAchievementModal({
  internId,
  availableAchievements,
  alreadyAwardedIds = [],
}: GiveAchievementModalProps) {
  const [mode, setMode] = useState<"select" | "custom">("select");

  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customIcon, setCustomIcon] = useState("award");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();

  const resetAndClose = (closeModal: () => void) => {
    setError(null);
    setSelectedAchievement(null);
    setCustomTitle("");
    setCustomDescription("");
    setCustomIcon("award");
    setMode("select");
    closeModal();
  };

  const handleSelect = (item: Achievement) => {
    setError(null);
    setSelectedAchievement(item);
  };

  const handleSubmit = async (closeModal: () => void) => {
    setIsSubmitting(true);
    setError(null);

    let result;

    if (mode === "select") {
      if (!selectedAchievement) {
        setIsSubmitting(false);
        return;
      }

      result = await giveAchievementAction({
        internId,
        achievementId: selectedAchievement.id,
        title: selectedAchievement.title,
        description: selectedAchievement.description,
        icon: selectedAchievement.icon,
        pathToRevalidate: pathname,
      });
    } else {
      if (!customTitle.trim() || !customDescription.trim()) {
        setError("Please fill in both title and description.");
        setIsSubmitting(false);
        return;
      }

      result = await createAndAssignCustomAchievementAction({
        internId,
        title: customTitle.trim(),
        description: customDescription.trim(),
        icon: customIcon,
        pathToRevalidate: pathname,
      });
    }

    setIsSubmitting(false);

    if (result.success) {
      resetAndClose(closeModal);
    } else {
      setError(result.error || "Failed to give achievement");
    }
  };

  const isFormInvalid =
    mode === "select"
      ? !selectedAchievement
      : !customTitle.trim() || !customDescription.trim();

  return (
    <Modal
      trigger={
        <Button type="button" onClick={() => setError(null)}>
          <Plus data-icon="inline-start" /> Give achievement
        </Button>
      }
      title="Give Achievement"
      description="Select an existing achievement or create a custom one for this intern."
    >
      {(close) => (
        <div className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex rounded-lg bg-muted p-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode("select");
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === "select"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Select Existing
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("custom");
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === "custom"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Custom
            </button>
          </div>

          {mode === "select" ? (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {availableAchievements.map((item) => {
                const isAlreadyGiven = alreadyAwardedIds.includes(item.id);
                const isSelected = selectedAchievement?.id === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isAlreadyGiven}
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      isAlreadyGiven
                        ? "opacity-50 cursor-not-allowed bg-muted/20 border-border"
                        : isSelected
                        ? "border-primary bg-accent shadow-sm"
                        : "border-border bg-card hover:bg-accent/50"
                    }`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {item.title}{" "}
                        {isAlreadyGiven && (
                          <span className="text-xs font-normal text-muted-foreground">
                            (Already awarded)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hackathon Winner"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  placeholder="e.g. Took 1st place in internal hackathon"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Choose Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(({ id, icon: IconComponent }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCustomIcon(id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                        customIcon === id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => resetAndClose(close)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(close)}
              disabled={isFormInvalid || isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : mode === "select"
                ? "Give"
                : "Create & Give"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

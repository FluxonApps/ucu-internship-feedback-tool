"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export function ScheduledFeedbackList({ internshipId }: { internshipId: string }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/manager/internships/${internshipId}/feedback-schedules`)
      .then((res) => res.json())
      .then((data) => {
        setSchedules(Array.isArray(data) ? data.filter((s: any) => s.status === "pending") : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [internshipId]);

  if (loading || schedules.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Scheduled Feedback</h3>
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
            <div>
              <p className="font-medium capitalize text-sm">Type: {schedule.type}</p>
              <p className="text-xs text-muted-foreground">
                Trigger at: {new Date(schedule.triggerAt).toLocaleString()}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await fetch(`/api/manager/internships/${internshipId}/feedback-schedules/${schedule.id}`, {
                  method: "DELETE",
                });
                setSchedules((current) => current.filter((s) => s.id !== schedule.id));
              }}
            >
              Cancel
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

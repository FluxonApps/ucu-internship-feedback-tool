"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

export function CloseAssignmentButton({
  internshipId,
  assignmentId,
  onSuccess,
}: {
  internshipId: string;
  assignmentId: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  function close() {
    setPending(true);
    return fetch(
      `/api/manager/internships/${internshipId}/teammate-assignments/${assignmentId}/close`,
      { method: "POST" },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not end assignment.");
        }
        onSuccess?.();
        router.refresh();
      })
      .finally(() => setPending(false));
  }
  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={close}
      disabled={pending}
    >
      {pending ? "Ending…" : "End assignment"}
    </Button>
  );
}

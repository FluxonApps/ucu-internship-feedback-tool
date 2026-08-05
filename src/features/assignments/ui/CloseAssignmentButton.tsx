"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { closeAssignment } from "../api/closeAssignment";

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
    closeAssignment({ internshipId, assignmentId })
      .then(() => {
        onSuccess?.();
        router.refresh();
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error(error.message);
        } else {
          console.error("An unexpected error occurred", error);
        }
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

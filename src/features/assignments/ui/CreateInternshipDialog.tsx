"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ApplicationUserOption } from "@/lib/assignments/types";

import { CreateInternshipForm } from "./CreateInternshipForm";

export function CreateInternshipDialog({
  interns,
}: {
  interns: ApplicationUserOption[];
}) {
  return (
    <Modal
      trigger={
        <Button type="button">
          <Plus data-icon="inline-start" /> Create internship
        </Button>
      }
      title="Create internship"
      description="Select an available intern and their first Team Placement."
    >
      {(close) => <CreateInternshipForm interns={interns} onSuccess={close} />}
    </Modal>
  );
}

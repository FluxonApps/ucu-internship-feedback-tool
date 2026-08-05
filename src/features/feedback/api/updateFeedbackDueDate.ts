type UpdateFeedbackDueDateParams = {
  internshipId: string;
  cycleId: string;
  dueAt: string | null;
};

type UpdateFeedbackDueDateResult = {
  error?: string;
};

export async function updateFeedbackDueDate({
  internshipId,
  cycleId,
  dueAt,
}: UpdateFeedbackDueDateParams): Promise<UpdateFeedbackDueDateResult> {
  const response = await fetch(
    `/api/manager/internships/${internshipId}/feedback-cycles/${cycleId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        dueAt,
      }),
    },
  );

  const body = await response.json();

  if (!response.ok) {
    return {
      error: body.error ?? "Unable to update the due date.",
    };
  }

  return {};
}

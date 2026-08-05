type CancelFeedbackCycleParams = {
  internshipId: string;
  cycleId: string;
  reason?: string;
};

type CancelFeedbackCycleResult = {
  error?: string;
};

export async function cancelFeedbackCycle({
  internshipId,
  cycleId,
  reason,
}: CancelFeedbackCycleParams): Promise<CancelFeedbackCycleResult> {
  const response = await fetch(
    `/api/manager/internships/${internshipId}/feedback-cycles/${cycleId}/cancel`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        reason: reason || undefined,
      }),
    },
  );

  const body = await response.json();

  if (!response.ok) {
    return {
      error: body.error ?? "Unable to cancel the cycle.",
    };
  }

  return {};
}

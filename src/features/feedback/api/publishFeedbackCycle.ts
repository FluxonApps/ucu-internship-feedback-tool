type PublishFeedbackCycleParams = {
  internshipId: string;
  cycleId: string;
  managerRecommendation: string;
};

type PublishFeedbackCycleResult = {
  error?: string;
};

export async function publishFeedbackCycle({
  internshipId,
  cycleId,
  managerRecommendation,
}: PublishFeedbackCycleParams): Promise<PublishFeedbackCycleResult> {
  const response = await fetch(
    `/api/manager/internships/${internshipId}/feedback-cycles/${cycleId}/publish`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        managerRecommendation,
      }),
    },
  );

  const body = await response.json();

  if (!response.ok) {
    return {
      error: body.error ?? "Unable to publish feedback.",
    };
  }

  return {};
}

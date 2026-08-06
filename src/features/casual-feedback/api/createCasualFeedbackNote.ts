type CreateCasualFeedbackNoteParams = {
  internshipId: string;
  date: string;
  text: string;
};

type CreateCasualFeedbackNoteResult = {
  error?: string;
};

export async function createCasualFeedbackNote({
  internshipId,
  date,
  text,
}: CreateCasualFeedbackNoteParams): Promise<CreateCasualFeedbackNoteResult> {
  const response = await fetch(
    `/api/teammate/internships/${internshipId}/casual-feedback`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ date, text }),
    },
  );

  const body = await response.json();

  if (!response.ok) {
    return {
      error: body.error ?? "Unable to save casual feedback.",
    };
  }

  return {};
}

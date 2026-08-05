import type { FeedbackAnswersDto } from "@/lib/feedback/types";

type SaveTeammateFeedbackParams = {
  internshipId: string;
  cycleId: string;
  answers: FeedbackAnswersDto;
  submit: boolean;
};

type SaveTeammateFeedbackResult = {
  error?: string;
};

export async function saveTeammateFeedback({
  internshipId,
  cycleId,
  answers,
  submit,
}: SaveTeammateFeedbackParams): Promise<SaveTeammateFeedbackResult> {
  const response = await fetch(
    `/api/teammate/internships/${internshipId}/feedback-cycles/${cycleId}/${submit ? "submit" : "draft"}`,
    {
      method: submit ? "POST" : "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(answers),
    },
  );

  const body = await response.json();

  if (!response.ok) {
    return {
      error: body.error ?? "Unable to save feedback.",
    };
  }

  return {};
}

export interface CreateInternshipParams {
  internId: string;
  team: { teamId: string } | { newTeamName: string };
  startsAt: string;
}

export interface CreateInternshipResponse {
  id: string;
  success?: boolean;
  message?: string;
  error?: string;
}

export async function createInternship(
  payload: CreateInternshipParams
): Promise<CreateInternshipResponse> {
  const response = await fetch("/api/manager/internships", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Unable to create the internship.");
  }

  return body as CreateInternshipResponse;
}

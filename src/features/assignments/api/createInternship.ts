type CreateInternshipPayload = {
  internId: string;
  team: { teamId: string } | { newTeamName: string };
  startsAt: string;
};

export async function createInternship(payload: CreateInternshipPayload) {
  const response = await fetch("/api/manager/internships", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Unable to create the internship.");
  }

  return body;
}

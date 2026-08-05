import { APIResponse } from "./types";

export interface AssignTeammateParams {
  internshipId: string;
  teammateUserId: string;
  teamId: string;
  responsibilities: string[];
  startsAt: string;
}

export async function assignTeammate(
  params: AssignTeammateParams
): Promise<APIResponse> {
  const response = await fetch(
    `/api/manager/internships/${params.internshipId}/teammate-assignments`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        teammateUserId: params.teammateUserId,
        teamId: params.teamId,
        responsibilities: params.responsibilities,
        startsAt: params.startsAt,
      }),
    }
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Unable to assign teammate.");
  }

  return body as APIResponse;
}

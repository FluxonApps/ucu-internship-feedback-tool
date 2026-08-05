import { APIResponse } from "./types";

export interface CreateTeamPlacementParams {
  internshipId: string;
  team: { teamId: string } | { newTeamName: string };
  startsAt: string;
}

export async function createTeamPlacement(
  params: CreateTeamPlacementParams
): Promise<APIResponse> {
  const response = await fetch(
    `/api/manager/internships/${params.internshipId}/team-placements`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        team: params.team,
        startsAt: params.startsAt,
      }),
    }
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Unable to add Team Placement.");
  }

  return body as APIResponse;
}

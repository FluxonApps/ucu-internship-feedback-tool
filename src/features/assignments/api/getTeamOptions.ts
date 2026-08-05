import type { TeamOption } from "@/lib/assignments/types";
export interface GetTeamOptionsResponse {
  teams: TeamOption[];
}

export async function getTeamOptions(): Promise<GetTeamOptionsResponse> {
  const response = await fetch("/api/manager/team-options");

  if (!response.ok) {
    throw new Error("Failed to fetch team options");
  }

  const body = await response.json();
  return body as GetTeamOptionsResponse;
}

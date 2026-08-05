import type { TeamOption } from "@/lib/assignments/types";
import { APIResponse } from "./types";

export interface GetTeamOptionsResponse extends APIResponse {
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

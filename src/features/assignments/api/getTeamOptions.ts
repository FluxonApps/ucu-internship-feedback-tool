import type { TeamOption } from "@/lib/assignments/types";

export async function getTeamOptions(): Promise<{ teams: TeamOption[] }> {
  const response = await fetch("/api/manager/team-options");
  if (!response.ok) {
    throw new Error("Failed to fetch team options");
  }
  return response.json();
}

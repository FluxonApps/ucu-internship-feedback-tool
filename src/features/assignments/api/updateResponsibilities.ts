import { APIResponse } from "./types";

export interface UpdateResponsibilitiesParams {
  internshipId: string;
  assignmentId: string;
  responsibilities: string[];
}

export async function updateResponsibilities(
  params: UpdateResponsibilitiesParams
): Promise<APIResponse> {
  const response = await fetch(
    `/api/manager/internships/${params.internshipId}/teammate-assignments/${params.assignmentId}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ responsibilities: params.responsibilities }),
    }
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error ?? "Could not save responsibilities.");
  }

  return body as APIResponse;
}

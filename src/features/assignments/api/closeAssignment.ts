export interface CloseAssignmentParams {
  internshipId: string;
  assignmentId: string;
}

export interface CloseAssignmentResponse {
  success?: boolean;
  message?: string;
}

export async function closeAssignment(
  params: CloseAssignmentParams
): Promise<CloseAssignmentResponse> {
  const response = await fetch(
    `/api/manager/internships/${params.internshipId}/teammate-assignments/${params.assignmentId}/close`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw new Error("Could not end assignment.");
  }

  const data = await response.json().catch(() => ({}));

  return data as CloseAssignmentResponse;
}

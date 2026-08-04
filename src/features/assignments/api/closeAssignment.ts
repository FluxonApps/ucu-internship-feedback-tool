export async function closeAssignment(internshipId: string, assignmentId: string) {
  const response = await fetch(
    `/api/manager/internships/${internshipId}/teammate-assignments/${assignmentId}/close`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw new Error("Could not end assignment.");
  }

  return response;
}

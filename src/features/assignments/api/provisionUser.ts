export interface ProvisionUserParams {
  email: string;
  roles: string[];
}

export interface ProvisionUserResponse {
  message?: string;
  success?: boolean;
}

export async function provisionUser(
  params: ProvisionUserParams
): Promise<ProvisionUserResponse> {
  const response = await fetch("/api/manager/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Unable to provision access.");
  }

  return body as ProvisionUserResponse;
}

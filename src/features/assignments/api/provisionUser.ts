export async function provisionUser(email: string, roles: string[]) {
  const response = await fetch("/api/manager/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      roles,
    }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Unable to provision access.");
  }

  return body;
}

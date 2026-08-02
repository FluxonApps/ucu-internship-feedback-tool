import { afterEach, describe, expect, it, vi } from "vitest";

import { getClientEnvironment } from "./client";

describe("getClientEnvironment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to Google authentication", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTHENTICATION_MODE", "google");

    expect(getClientEnvironment().authenticationMode).toBe("google");
  });

  it("allows development email/password mode outside production", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTHENTICATION_MODE", "email-password-development");

    expect(getClientEnvironment().authenticationMode).toBe(
      "email-password-development",
    );
  });

  it("rejects development email/password mode in production", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTHENTICATION_MODE", "email-password-development");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getClientEnvironment()).toThrow(
      "Email/password development authentication is unavailable in production.",
    );
  });
});

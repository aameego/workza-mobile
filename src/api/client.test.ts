import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createApiClient } from "./client.ts";

describe("createApiClient", () => {
  it("sends the bearer token and returns a JSON body", async () => {
    const client = createApiClient({
      baseUrl: "http://localhost:5001/api",
      getToken: () => "jwt",
      onUnauthorized: () => {},
      transport: async (request) => {
        assert.equal(request.url, "http://localhost:5001/api/auth/me");
        assert.equal(request.method, "GET");
        assert.equal(request.headers.Authorization, "Bearer jwt");
        return { status: 200, body: { ok: true } };
      },
    });

    const body = await client.request({ path: "/auth/me", method: "GET" });
    assert.deepEqual(body, { ok: true });
  });

  it("clears the session on a protected 401 and keeps a login 401 on the form", async () => {
    let cleared = 0;
    const client = createApiClient({
      baseUrl: "https://backend-gig.aameego.com/api/",
      getToken: () => "jwt",
      onUnauthorized: () => {
        cleared += 1;
      },
      transport: async (request) => {
        assert.equal(request.url, "https://backend-gig.aameego.com/api/auth/login");
        assert.equal(request.headers.Authorization, undefined);
        assert.equal(request.body, JSON.stringify({ emailOrPhone: "a@b.co" }));
        return { status: 401, body: { message: "Invalid credentials" } };
      },
    });

    await assert.rejects(
      () =>
        client.request({
          path: "auth/login",
          method: "POST",
          body: { emailOrPhone: "a@b.co" },
          auth: false,
          skipAuthRedirect: true,
        }),
      (error: unknown) => {
        assert.equal((error as { message: string }).message, "Invalid credentials");
        return true;
      }
    );
    assert.equal(cleared, 0);

    const protectedClient = createApiClient({
      baseUrl: "https://backend-gig.aameego.com/api",
      getToken: () => "jwt",
      onUnauthorized: () => {
        cleared += 1;
      },
      transport: async () => ({ status: 401, body: { message: "Token expired" } }),
    });

    await assert.rejects(() =>
      protectedClient.request({ path: "/auth/me", method: "GET" })
    );
    assert.equal(cleared, 1);
  });

  it("reads either message or error from a failed JSON body", async () => {
    const client = createApiClient({
      baseUrl: "https://dev-gig.aameego.com/api",
      getToken: () => null,
      onUnauthorized: () => {},
      transport: async () => ({
        status: 500,
        body: { error: "Failed to securely process and distribute verification token." },
      }),
    });

    await assert.rejects(
      () => client.request({ path: "/auth/send-otp", method: "POST", body: {}, auth: false }),
      (error: unknown) => {
        assert.equal(
          (error as { message: string }).message,
          "Failed to securely process and distribute verification token."
        );
        return true;
      }
    );
  });
});

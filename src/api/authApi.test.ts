import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  loginWithClient,
  sendForgotOtpWithClient,
  updateForgotPasswordWithClient,
  verifyForgotOtpWithClient,
} from "./authApi.ts";
import { createApiClient } from "./client.ts";

const guestClient = (
  transport: (request: { url: string; method: string; headers: Record<string, string>; body?: string }) => Promise<{
    status: number;
    body: unknown;
  }>
) =>
  createApiClient({
    baseUrl: "https://dev-gig.aameego.com/api",
    getToken: () => "jwt",
    onUnauthorized: () => {
      throw new Error("guest auth must not clear the session");
    },
    transport,
  });

describe("loginWithClient", () => {
  it("keeps a failed login on the form instead of clearing the session", async () => {
    const client = guestClient(async (request) => {
      assert.equal(request.url, "https://dev-gig.aameego.com/api/auth/login");
      assert.equal(request.method, "POST");
      assert.equal(request.headers.Authorization, undefined);
      return { status: 401, body: { message: "Invalid credentials" } };
    });

    const outcome = await loginWithClient(client)({
      emailOrPhone: "asha@acme.com",
      password: "wrong",
      vendorCode: "AMG8548",
      otp: "",
    });
    assert.deepEqual(outcome, { kind: "error", message: "Invalid credentials" });
  });
});

describe("forgot password API", () => {
  it("posts send-otp without a bearer token", async () => {
    const client = guestClient(async (request) => {
      assert.equal(request.url, "https://dev-gig.aameego.com/api/auth/send-otp");
      assert.equal(request.method, "POST");
      assert.equal(request.headers.Authorization, undefined);
      assert.equal(
        request.body,
        JSON.stringify({ emailOrPhone: "asha@acme.com", vendorCode: "AMG8548" })
      );
      return { status: 200, body: { message: "OTP sent" } };
    });

    await sendForgotOtpWithClient(client)({
      emailOrPhone: "asha@acme.com",
      vendorCode: "AMG8548",
    });
  });

  it("gets verify-otp with encoded query and skipAuthRedirect", async () => {
    const client = guestClient(async (request) => {
      assert.equal(
        request.url,
        "https://dev-gig.aameego.com/api/auth/verify-otp?emailOrPhone=a%2Bb%40workza.com&otp=123456&vendorCode=AMG8548"
      );
      assert.equal(request.method, "GET");
      assert.equal(request.headers.Authorization, undefined);
      return { status: 200, body: { message: "verified" } };
    });

    await verifyForgotOtpWithClient(client)({
      emailOrPhone: "a+b@workza.com",
      vendorCode: "AMG8548",
      otp: "123456",
    });
  });

  it("patches update-password without clearing session on a 401", async () => {
    const client = guestClient(async (request) => {
      assert.equal(request.url, "https://dev-gig.aameego.com/api/auth/update-password");
      assert.equal(request.method, "PATCH");
      return { status: 401, body: { message: "Invalid OTP session" } };
    });

    await assert.rejects(
      () =>
        updateForgotPasswordWithClient(client)({
          emailOrPhone: "asha@acme.com",
          vendorCode: "AMG8548",
          newPassword: "secret1",
          confirmPassword: "secret1",
        }),
      (error: unknown) => {
        assert.equal((error as { message: string }).message, "Invalid OTP session");
        return true;
      }
    );
  });
});

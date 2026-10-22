import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiError } from "../api/client.ts";
import { resetForgotPassword, requestForgotOtp, verifyForgotOtp } from "./forgotPasswordFlow.ts";

describe("requestForgotOtp", () => {
  it("does not call the API when the organisation code is incomplete", async () => {
    let called = false;
    const result = await requestForgotOtp({
      form: { identifier: "admin@workza.com", orgCode: "AMG" },
      sendOtp: async () => {
        called = true;
      },
    });
    assert.equal(called, false);
    assert.equal(result.kind, "error");
  });

  it("sends the trimmed contact and uppercased org code", async () => {
    const sent: unknown[] = [];
    const result = await requestForgotOtp({
      form: { identifier: " Admin@Workza.com ", orgCode: "amg8548" },
      sendOtp: async (payload) => {
        sent.push(payload);
      },
    });
    assert.equal(result.kind, "otpSent");
    assert.deepEqual(sent, [{ emailOrPhone: "admin@workza.com", vendorCode: "AMG8548" }]);
  });

  it("shows the server message when that email is not in the organisation", async () => {
    const result = await requestForgotOtp({
      form: { identifier: "admin@workza.com", orgCode: "AMG8548" },
      sendOtp: async () => {
        throw new ApiError("User does not exist", 400);
      },
    });
    assert.equal(result.kind, "error");
    if (result.kind === "error") assert.equal(result.message, "User does not exist");
  });
});

describe("verifyForgotOtp", () => {
  it("stops on a short code", async () => {
    let called = false;
    const result = await verifyForgotOtp({
      identifier: "admin@workza.com",
      orgCode: "AMG8548",
      otp: "123",
      verifyOtp: async () => {
        called = true;
      },
    });
    assert.equal(called, false);
    assert.equal(result.kind, "error");
  });

  it("advances after the server accepts the OTP", async () => {
    const sent: unknown[] = [];
    const result = await verifyForgotOtp({
      identifier: " Admin@Workza.com ",
      orgCode: "amg8548",
      otp: "123456",
      verifyOtp: async (payload) => {
        sent.push(payload);
      },
    });
    assert.equal(result.kind, "verified");
    assert.deepEqual(sent, [
      { emailOrPhone: "admin@workza.com", vendorCode: "AMG8548", otp: "123456" },
    ]);
  });

  it("keeps the server's invalid-OTP wording", async () => {
    const result = await verifyForgotOtp({
      identifier: "admin@workza.com",
      orgCode: "AMG8548",
      otp: "123456",
      verifyOtp: async () => {
        throw new ApiError("Invalid OTP", 400);
      },
    });
    assert.equal(result.kind, "error");
    if (result.kind === "error") assert.equal(result.message, "Invalid OTP");
  });
});

describe("resetForgotPassword", () => {
  it("does not call the API when the passwords do not match", async () => {
    let called = false;
    const result = await resetForgotPassword({
      identifier: "admin@workza.com",
      orgCode: "AMG8548",
      form: { newPassword: "secret", confirmPassword: "secret1" },
      updatePassword: async () => {
        called = true;
      },
    });
    assert.equal(called, false);
    assert.equal(result.kind, "error");
  });

  it("updates the password and reports success", async () => {
    const sent: unknown[] = [];
    const result = await resetForgotPassword({
      identifier: " admin@workza.com ",
      orgCode: "amg8548",
      form: { newPassword: "secret", confirmPassword: "secret" },
      updatePassword: async (payload) => {
        sent.push(payload);
      },
    });
    assert.equal(result.kind, "updated");
    assert.deepEqual(sent, [
      {
        emailOrPhone: "admin@workza.com",
        vendorCode: "AMG8548",
        newPassword: "secret",
        confirmPassword: "secret",
      },
    ]);
  });
});

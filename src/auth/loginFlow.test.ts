import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { interpretLoginResponse } from "./loginFlow.ts";
import { submitLogin } from "./submitLogin.ts";

const user = {
  id: "user-1",
  name: "Asha",
  role: "Admin",
  vendorName: "Acme",
  vendor_code: "ACME",
};

describe("interpretLoginResponse", () => {
  it("turns a two-factor response into an OTP step", () => {
    const outcome = interpretLoginResponse(200, {
      twoFactorRequired: true,
      sendTo: "a***@acme.com",
      message: "Two-factor authentication required.",
    });
    assert.deepEqual(outcome, {
      kind: "twoFactor",
      sendTo: "a***@acme.com",
      message: "Two-factor authentication required.",
    });
  });

  it("turns a token response into a session", () => {
    const outcome = interpretLoginResponse(200, {
      token: "jwt",
      user,
      organisations: [{ code: "acme", name: "Acme" }, { code: "" }],
    });
    assert.equal(outcome.kind, "session");
    if (outcome.kind !== "session") return;
    assert.equal(outcome.token, "jwt");
    assert.equal(outcome.user.name, "Asha");
    assert.deepEqual(outcome.organisations, [{ code: "ACME", name: "Acme" }]);
  });

  it("keeps the server message for a failed login", () => {
    const outcome = interpretLoginResponse(401, {
      message: "Invalid organization code",
    });
    assert.deepEqual(outcome, {
      kind: "error",
      message: "Invalid organization code",
    });
  });
});

describe("submitLogin", () => {
  it("does not call the API when the form is incomplete", async () => {
    let called = false;
    const result = await submitLogin({
      form: {
        identifier: "",
        password: "",
        orgCode: "",
        otp: "",
        rememberMe: false,
        twoFactor: false,
      },
      login: async () => {
        called = true;
        return { kind: "error", message: "nope" };
      },
      saveSession: async () => {},
    });
    assert.equal(called, false);
    assert.equal(result.kind, "error");
  });

  it("saves the session when login succeeds", async () => {
    const saved: unknown[] = [];
    const result = await submitLogin({
      form: {
        identifier: " admin@workza.com ",
        password: "secret",
        orgCode: "acme",
        otp: "",
        rememberMe: true,
        twoFactor: false,
      },
      login: async (payload) => {
        assert.equal(payload.emailOrPhone, "admin@workza.com");
        assert.equal(payload.vendorCode, "ACME");
        assert.equal(payload.otp, "");
        return {
          kind: "session",
          token: "jwt",
          user,
          organisations: [{ code: "ACME", name: "Acme" }],
        };
      },
      saveSession: async (session, rememberMe) => {
        saved.push({ session, rememberMe });
      },
    });
    assert.equal(result.kind, "signedIn");
    assert.equal(saved.length, 1);
  });

  it("returns the OTP step without saving a session", async () => {
    let saved = false;
    const result = await submitLogin({
      form: {
        identifier: "admin@workza.com",
        password: "secret",
        orgCode: "ACME",
        otp: "",
        rememberMe: false,
        twoFactor: false,
      },
      login: async () => ({
        kind: "twoFactor",
        sendTo: "a***@acme.com",
        message: "Code sent",
      }),
      saveSession: async () => {
        saved = true;
      },
    });
    assert.equal(saved, false);
    assert.deepEqual(result, {
      kind: "twoFactor",
      sendTo: "a***@acme.com",
      message: "Code sent",
    });
  });
});

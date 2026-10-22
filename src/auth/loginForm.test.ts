import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isSignInReady, normalizeOrgCode, validateLoginForm } from "./loginForm.ts";

const ready = {
  identifier: "admin@workza.com",
  password: "secret",
  orgCode: "acme",
  otp: "",
  twoFactor: false,
};

describe("login form", () => {
  it("uppercases the organisation code as it is typed", () => {
    assert.equal(normalizeOrgCode("acme"), "ACME");
  });

  it("stays disabled until email, password, and organisation code are present", () => {
    assert.equal(isSignInReady(ready), true);
    assert.equal(isSignInReady({ ...ready, identifier: "  " }), false);
    assert.equal(isSignInReady({ ...ready, password: "" }), false);
    assert.equal(isSignInReady({ ...ready, orgCode: "" }), false);
  });

  it("requires a 6-digit code only after two-factor is requested", () => {
    assert.equal(isSignInReady({ ...ready, twoFactor: true, otp: "12345" }), false);
    assert.equal(isSignInReady({ ...ready, twoFactor: true, otp: "123456" }), true);
  });

  it("rejects an incomplete email and markup in the identifier", () => {
    const email = validateLoginForm({ ...ready, identifier: "admin@workza" });
    assert.match(email.errors.identifier, /Work Email or Mobile Number/);

    const markup = validateLoginForm({ ...ready, identifier: "<script>" });
    assert.match(markup.errors.identifier, /Work Email or Mobile Number/);
  });

  it("accepts a phone number that is not an email", () => {
    const result = validateLoginForm({ ...ready, identifier: "9876543210" });
    assert.equal(result.valid, true);
  });

  it("names the organisation code when it is missing", () => {
    const result = validateLoginForm({ ...ready, orgCode: " " });
    assert.match(result.errors.orgCode, /Organization Code/);
  });
});

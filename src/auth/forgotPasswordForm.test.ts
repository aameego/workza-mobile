import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  OTP_RESEND_SECONDS,
  forgotHeader,
  formatResendCountdown,
  isIdentifyReady,
  isResetReady,
  isVerifyReady,
  maskForgotContact,
  normalizeForgotContact,
  validateForgotIdentify,
  validateForgotReset,
  validateForgotVerify,
  verifyOtpPath,
} from "./forgotPasswordForm.ts";

const identify = {
  identifier: "admin@workza.com",
  orgCode: "AMG8548",
};

describe("forgot password identify", () => {
  it("stays disabled until email and organisation code are present", () => {
    assert.equal(isIdentifyReady(identify), true);
    assert.equal(isIdentifyReady({ ...identify, identifier: "  " }), false);
    assert.equal(isIdentifyReady({ ...identify, orgCode: "" }), false);
  });

  it("rejects an incomplete organisation prefix before any OTP is requested", () => {
    const result = validateForgotIdentify({ ...identify, orgCode: "AMG" });
    assert.equal(result.valid, false);
    assert.match(result.errors.orgCode ?? "", /complete, valid Organization Code/);
  });

  it("rejects an incomplete email the same way the web screen does", () => {
    const result = validateForgotIdentify({ ...identify, identifier: "admin@workza" });
    assert.match(result.errors.identifier ?? "", /valid registered email/);
  });

  it("accepts a complete org code with an optional hyphen", () => {
    assert.equal(validateForgotIdentify(identify).valid, true);
    assert.equal(validateForgotIdentify({ ...identify, orgCode: "acme-1234" }).valid, true);
  });

  it("accepts a phone number the same way login does", () => {
    assert.equal(validateForgotIdentify({ ...identify, identifier: "9876543210" }).valid, true);
  });

  it("rejects markup in the identifier", () => {
    const result = validateForgotIdentify({ ...identify, identifier: "<script>alert(1)</script>" });
    assert.match(result.errors.identifier ?? "", /invalid characters/);
  });
});

describe("forgot password verify and reset", () => {
  it("requires a 6-digit OTP", () => {
    assert.equal(isVerifyReady("12345"), false);
    assert.equal(isVerifyReady("123456"), true);
    assert.match(validateForgotVerify("12ab56").errors.otp ?? "", /6-digit/);
  });

  it("keeps Update disabled until both passwords are at least 5 characters and match", () => {
    assert.equal(isResetReady({ newPassword: "secret", confirmPassword: "secret" }), true);
    assert.equal(isResetReady({ newPassword: "sec", confirmPassword: "sec" }), false);
    assert.equal(isResetReady({ newPassword: "secret", confirmPassword: "secret1" }), false);
    assert.match(
      validateForgotReset({ newPassword: "secret", confirmPassword: "secret1" }).errors.confirmPassword ?? "",
      /do not match/
    );
    assert.match(
      validateForgotReset({ newPassword: "sec", confirmPassword: "sec" }).errors.newPassword ?? "",
      /at least 5 characters/
    );
  });
});

describe("normalizeForgotContact", () => {
  it("lowercases emails so verify-otp matches the address send-otp stored", () => {
    assert.equal(normalizeForgotContact(" Admin@Workza.com "), "admin@workza.com");
  });

  it("strips spaces from phone numbers the way the backend does", () => {
    assert.equal(normalizeForgotContact(" 98765 43210 "), "9876543210");
  });
});

describe("forgot password copy", () => {
  it("masks the contact the web verification subtitle uses", () => {
    assert.equal(maskForgotContact("asha@acme.com"), "a***e@acme.com");
    assert.equal(maskForgotContact("9876543210"), "+91 ******3210");
  });

  it("titles each step the same way as the web screen", () => {
    assert.equal(forgotHeader("identify", "").title, "Forgot Password!");
    assert.match(forgotHeader("verify", "asha@acme.com").subtitle, /a\*\*\*e@acme.com/);
    assert.equal(forgotHeader("reset", "").title, "Reset Password!");
  });

  it("counts down the 45-second resend window", () => {
    assert.equal(OTP_RESEND_SECONDS, 45);
    assert.equal(formatResendCountdown(45), "0:45");
    assert.equal(formatResendCountdown(5), "0:05");
  });
});

describe("verifyOtpPath", () => {
  it("encodes the GET query the web client sends", () => {
    assert.equal(
      verifyOtpPath({
        emailOrPhone: "a+b@workza.com",
        otp: "123456",
        vendorCode: "AMG8548",
      }),
      "/auth/verify-otp?emailOrPhone=a%2Bb%40workza.com&otp=123456&vendorCode=AMG8548"
    );
  });
});

import { ApiError } from "../api/client";
import {
  type ForgotIdentifyValues,
  type ForgotResetValues,
  normalizeForgotContact,
  validateForgotIdentify,
  validateForgotReset,
  validateForgotVerify,
} from "./forgotPasswordForm";

export type ForgotOtpPayload = {
  emailOrPhone: string;
  vendorCode: string;
};

export type ForgotResetPayload = ForgotOtpPayload & {
  newPassword: string;
  confirmPassword: string;
};

export type ForgotActionResult = { kind: "otpSent" | "verified" | "updated" } | { kind: "error"; message: string };

const firstIdentifyError = (form: ForgotIdentifyValues) => {
  const { errors } = validateForgotIdentify(form);
  return errors.identifier || errors.orgCode || "Check the form and try again";
};

const fail = (error: unknown, fallback: string): ForgotActionResult => ({
  kind: "error",
  message: error instanceof ApiError ? error.message : fallback,
});

export const requestForgotOtp = async ({
  form,
  sendOtp,
}: {
  form: ForgotIdentifyValues;
  sendOtp: (payload: ForgotOtpPayload) => Promise<void>;
}): Promise<ForgotActionResult> => {
  if (!validateForgotIdentify(form).valid) {
    return { kind: "error", message: firstIdentifyError(form) };
  }
  const payload = {
    emailOrPhone: normalizeForgotContact(form.identifier),
    vendorCode: form.orgCode.trim().toUpperCase(),
  };
  try {
    await sendOtp(payload);
    return { kind: "otpSent" };
  } catch (error) {
    return fail(error, "Failed to send OTP. Please try again.");
  }
};

export const verifyForgotOtp = async ({
  identifier,
  orgCode,
  otp,
  verifyOtp,
}: {
  identifier: string;
  orgCode: string;
  otp: string;
  verifyOtp: (payload: ForgotOtpPayload & { otp: string }) => Promise<void>;
}): Promise<ForgotActionResult> => {
  if (!validateForgotVerify(otp).valid) {
    return { kind: "error", message: validateForgotVerify(otp).errors.otp || "Please enter the complete 6-digit OTP" };
  }
  try {
    await verifyOtp({
      emailOrPhone: normalizeForgotContact(identifier),
      vendorCode: orgCode.trim().toUpperCase(),
      otp: otp.trim(),
    });
    return { kind: "verified" };
  } catch (error) {
    return fail(error, "Invalid or expired OTP.");
  }
};

export const resetForgotPassword = async ({
  identifier,
  orgCode,
  form,
  updatePassword,
}: {
  identifier: string;
  orgCode: string;
  form: ForgotResetValues;
  updatePassword: (payload: ForgotResetPayload) => Promise<void>;
}): Promise<ForgotActionResult> => {
  if (!validateForgotReset(form).valid) {
    const { errors } = validateForgotReset(form);
    return { kind: "error", message: errors.confirmPassword || errors.newPassword || "Check the form and try again" };
  }
  try {
    await updatePassword({
      emailOrPhone: normalizeForgotContact(identifier),
      vendorCode: orgCode.trim().toUpperCase(),
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    });
    return { kind: "updated" };
  } catch (error) {
    return fail(error, "Could not reset password.");
  }
};

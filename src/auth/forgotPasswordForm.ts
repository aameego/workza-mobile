export type ForgotIdentifyValues = {
  identifier: string;
  orgCode: string;
};

export type ForgotResetValues = {
  newPassword: string;
  confirmPassword: string;
};

export type ForgotStep = "identify" | "verify" | "reset";

export const OTP_RESEND_SECONDS = 45;

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const ORG_CODE = /^[A-Z]{2,10}-?[0-9]{3,8}$/;
const UNSAFE = /[<>]|script|javascript/i;

const IDENTIFIER = "Work Email or Mobile Number";
const ORG_LABEL = "Organization Code";
const OTP = "Verification Code";
const NEW_PASSWORD = "New Password";
const CONFIRM_PASSWORD = "Confirm New Password";

export const normalizeForgotOrgCode = (value: string) => value.toUpperCase();

/** send-otp stores emails in lowercase; verify-otp looks up that same string. */
export const normalizeForgotContact = (value: string) => {
  const contact = value.trim();
  if (contact.includes("@")) return contact.toLowerCase();
  return contact.replace(/\s+/g, "");
};

export const isIdentifyReady = (values: ForgotIdentifyValues) =>
  Boolean(values.identifier.trim() && values.orgCode.trim());

export const isVerifyReady = (otp: string) => /^\d{6}$/.test(otp.trim());

export const isResetReady = (values: ForgotResetValues) =>
  values.newPassword.length >= 5 &&
  values.confirmPassword.length >= 5 &&
  values.newPassword === values.confirmPassword;

export const validateForgotIdentify = (values: ForgotIdentifyValues) => {
  const errors: Partial<Record<"identifier" | "orgCode", string>> = {};
  const identifier = values.identifier.trim();
  const orgCode = values.orgCode.trim().toUpperCase();

  if (!identifier) errors.identifier = `${IDENTIFIER} is required`;
  else if (UNSAFE.test(identifier)) errors.identifier = `${IDENTIFIER} contains invalid characters`;
  else if (identifier.includes("@") && !EMAIL.test(identifier)) {
    errors.identifier = "Please enter a valid registered email ID";
  } else if (identifier.length > 254) errors.identifier = `${IDENTIFIER} is too long`;

  if (!orgCode) errors.orgCode = `${ORG_LABEL} is required`;
  else if (!ORG_CODE.test(orgCode)) {
    errors.orgCode = "Please enter a complete, valid Organization Code";
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

export const validateForgotVerify = (otp: string) => {
  const errors: Partial<Record<"otp", string>> = {};
  if (!isVerifyReady(otp)) errors.otp = "Please enter the complete 6-digit OTP";
  return { valid: Object.keys(errors).length === 0, errors };
};

export const validateForgotReset = (values: ForgotResetValues) => {
  const errors: Partial<Record<"newPassword" | "confirmPassword", string>> = {};
  if (!values.newPassword) errors.newPassword = `${NEW_PASSWORD} is required`;
  else if (values.newPassword.length < 5) {
    errors.newPassword = "Password must be at least 5 characters long";
  } else if (values.newPassword.length > 128) errors.newPassword = `${NEW_PASSWORD} is too long`;

  if (!values.confirmPassword) errors.confirmPassword = `${CONFIRM_PASSWORD} is required`;
  else if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

export const maskForgotContact = (value: string) => {
  const contact = value.trim();
  if (contact.includes("@")) return contact.replace(/(.{1}).*(@.*)/, "$1***e$2");
  return `+91 ${contact.replace(/.(?=.{4})/g, "*")}`;
};

export const forgotHeader = (step: ForgotStep, identifier: string) => {
  if (step === "verify") {
    return {
      title: "Enter Verification Details!",
      subtitle: `Enter 6-digit code sent to ${maskForgotContact(identifier)}`,
    };
  }
  if (step === "reset") {
    return {
      title: "Reset Password!",
      subtitle: "Change your password by entering your new details.",
    };
  }
  return {
    title: "Forgot Password!",
    subtitle: "Recover access to your account by verifying your identity.",
  };
};

export const formatResendCountdown = (seconds: number) => {
  const clamped = Math.max(0, seconds);
  return `0:${clamped < 10 ? `0${clamped}` : clamped}`;
};

export const verifyOtpPath = ({
  emailOrPhone,
  otp,
  vendorCode,
}: {
  emailOrPhone: string;
  otp: string;
  vendorCode: string;
}) => {
  const query = new URLSearchParams({ emailOrPhone, otp, vendorCode }).toString();
  return `/auth/verify-otp?${query}`;
};

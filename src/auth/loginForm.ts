import type { LoginFormValues } from "./loginFormValues";

export type { LoginFormValues };

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const UNSAFE = /[<>]|script|javascript/i;

const IDENTIFIER = "Work Email or Mobile Number";
const PASSWORD = "Password";
const ORG_CODE = "Organization Code";
const OTP = "Verification Code";

export const normalizeOrgCode = (value: string) => value.toUpperCase();

export const validateLoginForm = (values: LoginFormValues) => {
  const errors: Partial<Record<"identifier" | "password" | "orgCode" | "otp", string>> = {};
  const identifier = values.identifier.trim();

  if (!identifier) errors.identifier = `${IDENTIFIER} is required`;
  else if (UNSAFE.test(identifier)) errors.identifier = `${IDENTIFIER} contains invalid characters`;
  else if (identifier.includes("@") && !EMAIL.test(identifier)) {
    errors.identifier = `${IDENTIFIER} must be a valid email`;
  } else if (identifier.length > 254) errors.identifier = `${IDENTIFIER} is too long`;

  if (!values.password) errors.password = `${PASSWORD} is required`;
  else if (values.password.length > 128) errors.password = `${PASSWORD} is too long`;

  const orgCode = values.orgCode.trim();
  if (!orgCode) errors.orgCode = `${ORG_CODE} is required`;
  else if (UNSAFE.test(orgCode) || orgCode.length > 32) {
    errors.orgCode = `${ORG_CODE} contains invalid characters`;
  }

  if (values.twoFactor && !/^\d{6}$/.test(values.otp.trim())) {
    errors.otp = `${OTP} must be 6 digits`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

export const isSignInReady = (values: LoginFormValues) => validateLoginForm(values).valid;

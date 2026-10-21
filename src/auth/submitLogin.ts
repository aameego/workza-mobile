import { validateLoginForm } from "./loginForm";
import type { LoginFormValues } from "./loginFormValues";
import type { LoginOutcome, LoginPayload, SessionData, SubmitLoginResult } from "./types";

const firstError = (form: LoginFormValues) => {
  const { errors } = validateLoginForm(form);
  return (
    errors.identifier ||
    errors.password ||
    errors.orgCode ||
    errors.otp ||
    "Check the form and try again"
  );
};

export const submitLogin = async ({
  form,
  login,
  saveSession,
}: {
  form: LoginFormValues;
  login: (payload: LoginPayload) => Promise<LoginOutcome>;
  saveSession: (session: SessionData, rememberMe: boolean) => Promise<void>;
}): Promise<SubmitLoginResult> => {
  if (!validateLoginForm(form).valid) {
    return { kind: "error", message: firstError(form) };
  }

  const outcome = await login({
    emailOrPhone: form.identifier.trim(),
    password: form.password,
    vendorCode: form.orgCode.trim().toUpperCase(),
    otp: form.otp.trim(),
  });

  if (outcome.kind === "session") {
    await saveSession(
      {
        token: outcome.token,
        user: outcome.user,
        organisations: outcome.organisations,
      },
      form.rememberMe
    );
    return { kind: "signedIn" };
  }

  return outcome;
};

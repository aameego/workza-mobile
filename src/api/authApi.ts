import { ApiError, type ApiClient } from "./client";
import { interpretLoginResponse } from "../auth/loginFlow";
import type { ForgotOtpPayload, ForgotResetPayload } from "../auth/forgotPasswordFlow";
import { verifyOtpPath } from "../auth/forgotPasswordForm";
import type { LoginOutcome, LoginPayload } from "../auth/types";

export const loginWithClient =
  (client: ApiClient) =>
  async (payload: LoginPayload): Promise<LoginOutcome> => {
    try {
      const body = await client.request({
        path: "/auth/login",
        method: "POST",
        body: payload,
        auth: false,
        skipAuthRedirect: true,
      });
      return interpretLoginResponse(200, body);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Login failed";
      return { kind: "error", message };
    }
  };

const guestAuth = { auth: false as const, skipAuthRedirect: true as const };

export const sendForgotOtpWithClient =
  (client: ApiClient) =>
  async (payload: ForgotOtpPayload) => {
    await client.request({
      path: "/auth/send-otp",
      method: "POST",
      body: payload,
      ...guestAuth,
    });
  };

export const verifyForgotOtpWithClient =
  (client: ApiClient) =>
  async (payload: ForgotOtpPayload & { otp: string }) => {
    await client.request({
      path: verifyOtpPath(payload),
      method: "GET",
      ...guestAuth,
    });
  };

export const updateForgotPasswordWithClient =
  (client: ApiClient) =>
  async (payload: ForgotResetPayload) => {
    await client.request({
      path: "/auth/update-password",
      method: "PATCH",
      body: payload,
      ...guestAuth,
    });
  };

import { ApiError, type ApiClient } from "./client";
import { interpretLoginResponse } from "../auth/loginFlow";
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

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { loginWithClient } from "../api/authApi";
import { ApiError, createApiClient, fetchTransport, type ApiClient } from "../api/client";
import { interpretLoginResponse } from "../auth/loginFlow";
import type { LoginFormValues } from "../auth/loginFormValues";
import { submitLogin } from "../auth/submitLogin";
import type { SessionData, SubmitLoginResult } from "../auth/types";
import { API_BASE_URL } from "../config/api";
import { deviceKeyValueStore } from "./secureStore";
import { createSessionController, type SessionController } from "./sessionStore";

type SessionContextValue = {
  ready: boolean;
  session: SessionData | null;
  signIn: (form: LoginFormValues) => Promise<SubmitLoginResult>;
  switchOrganisation: (vendorCode: string, otp?: string) => Promise<SubmitLoginResult>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const controllerRef = useRef<SessionController>(createSessionController(deviceKeyValueStore));
  const [session, setSession] = useState<SessionData | null>(null);
  const [ready, setReady] = useState(false);

  const apiRef = useRef<ApiClient>(
    createApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => controllerRef.current.token(),
      onUnauthorized: () => {
        void controllerRef.current.clear().then(() => setSession(null));
      },
      transport: fetchTransport,
    })
  );

  useEffect(() => {
    let active = true;
    controllerRef.current.hydrate().then((restored) => {
      if (!active) return;
      setSession(restored);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      ready,
      session,
      signIn: (form) =>
        submitLogin({
          form,
          login: loginWithClient(apiRef.current),
          saveSession: async (next, rememberMe) => {
            await controllerRef.current.persist(next, rememberMe);
            setSession(next);
          },
        }),
      switchOrganisation: async (vendorCode, otp) => {
        try {
          const body = await apiRef.current.request({
            path: "/auth/switch-organisation",
            method: "POST",
            body: { vendorCode, ...(otp ? { otp } : {}) },
            skipAuthRedirect: true,
          });
          const outcome = interpretLoginResponse(200, body);
          if (outcome.kind === "session") {
            const next = {
              token: outcome.token,
              user: outcome.user,
              organisations: outcome.organisations,
            };
            await controllerRef.current.persist(next, controllerRef.current.remembers());
            setSession(next);
            return { kind: "signedIn" };
          }
          return outcome;
        } catch (error) {
          const message = error instanceof ApiError ? error.message : "Could not switch organisation";
          return { kind: "error", message };
        }
      },
      signOut: async () => {
        await controllerRef.current.clear();
        setSession(null);
      },
    }),
    [ready, session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
};

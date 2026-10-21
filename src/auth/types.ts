export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  vendorName: string | null;
  vendor_code?: string;
  allowedModules: string[];
};

export type Organisation = {
  code: string;
  name: string;
};

export type SessionData = {
  token: string;
  user: AuthUser;
  organisations: Organisation[];
};

export type LoginPayload = {
  emailOrPhone: string;
  password: string;
  vendorCode: string;
  otp: string;
};

export type LoginOutcome =
  | { kind: "twoFactor"; sendTo: string; message: string }
  | { kind: "session"; token: string; user: AuthUser; organisations: Organisation[] }
  | { kind: "error"; message: string };

export type SubmitLoginResult =
  | { kind: "twoFactor"; sendTo: string; message: string }
  | { kind: "signedIn" }
  | { kind: "error"; message: string };

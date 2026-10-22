export type AuthUser = {
  id: string;
  name: string;
  role: string;
  vendorName: string | null;
  allowedModules: string[];
  email?: string;
  phone?: string;
  vendor_code?: string;
  vendorId?: unknown;
  employeeId?: unknown;
  employeeCode?: string | null;
  employeeName?: string | null;
  photoUrl?: string;
  photoDisplayUrl?: string;
  logoUrl?: string;
  isTwoFactor?: boolean;
  isConsultancy?: boolean;
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

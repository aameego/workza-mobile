import type { AuthUser, LoginOutcome, Organisation } from "./types";

const TWO_FACTOR_MESSAGE =
  "Two-factor authentication required. Please enter the OTP sent to your registered destination.";

const readOrganisations = (value: unknown): Organisation[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const organisations: Organisation[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const code = String(record.code || "").trim().toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const name = String(record.name || code).trim() || code;
    organisations.push({ code, name });
  }
  return organisations;
};

const readUser = (value: unknown): AuthUser | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = record.id ?? record._id;
  if ((typeof id !== "string" && typeof id !== "number") || !String(id)) return null;
  if (typeof record.name !== "string" || typeof record.role !== "string") return null;
  return {
    ...(record as AuthUser),
    id: String(id),
    name: record.name,
    role: record.role,
    vendorName: typeof record.vendorName === "string" ? record.vendorName : null,
    allowedModules: Array.isArray(record.allowedModules)
      ? record.allowedModules.filter((item): item is string => typeof item === "string")
      : [],
  };
};

const messageFrom = (record: Record<string, unknown> | null) =>
  record && typeof record.message === "string" && record.message.trim()
    ? record.message
    : "Login failed";

export const interpretLoginResponse = (status: number, body: unknown): LoginOutcome => {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;

  if (record?.twoFactorRequired === true) {
    return {
      kind: "twoFactor",
      sendTo: typeof record.sendTo === "string" ? record.sendTo : "",
      message:
        typeof record.message === "string" && record.message.trim()
          ? record.message
          : TWO_FACTOR_MESSAGE,
    };
  }

  if (status >= 200 && status < 300 && record && typeof record.token === "string") {
    const user = readUser(record.user);
    if (user) {
      return {
        kind: "session",
        token: record.token,
        user,
        organisations: readOrganisations(record.organisations),
      };
    }
  }

  return { kind: "error", message: messageFrom(record) };
};

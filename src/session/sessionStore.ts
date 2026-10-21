import type { SessionData } from "../auth/types";

export type KeyValueStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
};

const TOKEN_KEY = "token";
const USER_KEY = "user";
const ORGS_KEY = "organisations";
const REMEMBER_KEY = "rememberMe";
const KEYS = [TOKEN_KEY, USER_KEY, ORGS_KEY, REMEMBER_KEY];

const readSession = (token: string | null, userRaw: string | null, orgsRaw: string | null): SessionData | null => {
  if (!token || !userRaw) return null;
  try {
    const user = JSON.parse(userRaw) as SessionData["user"];
    const organisations = orgsRaw ? (JSON.parse(orgsRaw) as SessionData["organisations"]) : [];
    if (!user || typeof user !== "object" || typeof user.role !== "string") return null;
    return {
      token,
      user,
      organisations: Array.isArray(organisations) ? organisations : [],
    };
  } catch {
    return null;
  }
};

export const createSessionController = (store: KeyValueStore) => {
  let current: SessionData | null = null;
  let remembered = false;

  const deleteAll = async () => {
    await Promise.all(KEYS.map((key) => store.deleteItem(key)));
  };

  return {
    token: () => current?.token ?? null,
    remembers: () => remembered,
    current: () => current,

    async hydrate(): Promise<SessionData | null> {
      const flag = await store.getItem(REMEMBER_KEY);
      if (flag !== "true") {
        current = null;
        remembered = false;
        return null;
      }
      const session = readSession(
        await store.getItem(TOKEN_KEY),
        await store.getItem(USER_KEY),
        await store.getItem(ORGS_KEY)
      );
      if (!session) {
        await deleteAll();
        current = null;
        remembered = false;
        return null;
      }
      current = session;
      remembered = true;
      return session;
    },

    async persist(session: SessionData, rememberMe: boolean) {
      current = session;
      remembered = rememberMe;
      if (!rememberMe) {
        await deleteAll();
        return;
      }
      await store.setItem(REMEMBER_KEY, "true");
      await store.setItem(TOKEN_KEY, session.token);
      await store.setItem(USER_KEY, JSON.stringify(session.user));
      await store.setItem(ORGS_KEY, JSON.stringify(session.organisations));
    },

    async clear() {
      current = null;
      remembered = false;
      await deleteAll();
    },
  };
};

export type SessionController = ReturnType<typeof createSessionController>;

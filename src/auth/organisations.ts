import type { Organisation } from "./types";

/** Same rule as the web app: one organisation stays hidden; the current one is listed first. */
export const organisationsForSwitcher = (
  organisations: Array<Pick<Organisation, "code" | "name">> | null | undefined,
  currentCode?: string | null
) => {
  const current = String(currentCode || "").trim().toUpperCase();
  const seen = new Set<string>();
  const list: Array<Organisation & { current: boolean }> = [];

  for (const org of organisations || []) {
    const code = String(org?.code || "").trim().toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    list.push({
      code,
      name: String(org?.name || code).trim() || code,
      current: code === current,
    });
  }

  if (list.length < 2) return [];
  return list.sort(
    (a, b) => Number(b.current) - Number(a.current) || a.name.localeCompare(b.name)
  );
};

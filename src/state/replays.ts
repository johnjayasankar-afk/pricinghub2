const KEY = "keepfloor.replays.v1";
const MAX = 6;

export function loadReplays(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function rememberReplay(text: string): string[] {
  const body = text.trim();
  if (!body) return loadReplays();
  const rest = loadReplays().filter((s) => s !== body);
  const next = [body, ...rest].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

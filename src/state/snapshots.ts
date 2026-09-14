export type Snapshot = {
  name: string;
  at: number;
  list: number;
  safe: number;
  keep: number;
};

const KEY = "keepfloor.snaps.v1";
const MAX = 16;

export function loadSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Snapshot[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function rememberSnapshot(snap: Snapshot): Snapshot[] {
  const all = loadSnapshots().filter((s) => !(s.name === snap.name && s.list === snap.list && s.safe === snap.safe));
  const next = [snap, ...all].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

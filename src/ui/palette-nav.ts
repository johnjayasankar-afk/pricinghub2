export function nextEnabled<T extends { disabled?: boolean }>(cmds: T[], from: number, dir: 1 | -1): number {
  let i = from + dir;
  while (i >= 0 && i < cmds.length) {
    if (!cmds[i]?.disabled) return i;
    i += dir;
  }
  return from;
}

export function firstEnabled<T extends { disabled?: boolean }>(cmds: T[]): number {
  const i = cmds.findIndex((c) => !c.disabled);
  return i < 0 ? 0 : i;
}

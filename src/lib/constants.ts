export const MISS_SCORE = 8;

export const PLAYER_COLORS = [
  "#6aaa64",
  "#c9b458",
  "#3a86ff",
  "#e07a5f",
  "#9b5de5",
  "#f15bb5",
  "#00bbf9",
  "#ff6b6b",
  "#4dd4ac",
  "#f4a259",
];

/**
 * Color for `key` (usually a player's name). Pass `allKeys` -- everyone
 * currently being shown together (e.g. all players in a chart or picker)
 * -- to guarantee no two of them collide, cycling through the palette by
 * stable position instead of an independent hash per name. Without
 * `allKeys` (e.g. a lone Avatar with no roster in scope) falls back to a
 * per-name hash, which can rarely collide with another name -- acceptable
 * there since the name is always shown alongside it.
 */
export function colorForKey(key: string, allKeys?: string[]): string {
  if (allKeys && allKeys.length > 0) {
    const idx = allKeys.indexOf(key);
    if (idx !== -1) return PLAYER_COLORS[idx % PLAYER_COLORS.length];
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return PLAYER_COLORS[Math.abs(hash) % PLAYER_COLORS.length];
}

/** Whether a player had already joined as of `date` -- someone added
 * partway through a week can't be expected to have logged (or be
 * penalized for missing) days before they existed. Lives here (not
 * lib/data.ts) so client components can safely import it too. */
export function hasJoinedBy(
  player: { created_at: string },
  date: string
): boolean {
  return player.created_at.slice(0, 10) <= date;
}

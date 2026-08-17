export const MISS_SCORE = 8;

/** All-time records (Hall of Fame) only count from this date onward --
 * excludes early setup/test data from before the app was actually in
 * real use. */
export const STATS_START_DATE = "2026-07-27";

// Tailwind's "-400" shades -- muted enough to sit comfortably on a zinc-950
// background without turning into a wall of pure neon, but still distinct
// and readable at a glance.
export const PLAYER_COLORS = [
  "#34d399", // emerald-400
  "#38bdf8", // sky-400
  "#fbbf24", // amber-400
  "#fb7185", // rose-400
  "#a78bfa", // violet-400
  "#e879f9", // fuchsia-400
  "#22d3ee", // cyan-400
  "#fb923c", // orange-400
  "#2dd4bf", // teal-400
  "#a3e635", // lime-400
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

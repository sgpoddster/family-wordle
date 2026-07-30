export const MISS_SCORE = 8;

export const PLAYER_COLORS = [
  "#6aaa64",
  "#c9b458",
  "#3a86ff",
  "#e07a5f",
  "#9b5de5",
  "#f15bb5",
  "#00bbf9",
];

export function colorForKey(key: string): string {
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

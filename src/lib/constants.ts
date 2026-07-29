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

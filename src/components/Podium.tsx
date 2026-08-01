import StatsAvatar from "@/components/StatsAvatar";
import { colorForKey } from "@/lib/constants";
import type { Player } from "@/lib/data";

type Standing = { player: Player; total: number };

const HEIGHTS = [96, 72, 56];
const MEDALS = ["🥇", "🥈", "🥉"];
const RING_STYLES = [
  "ring-amber-400/70",
  "ring-zinc-300/50",
  "ring-orange-600/60",
];
const BLOCK_STYLES = [
  "bg-gradient-to-b from-amber-400/25 via-amber-500/10 to-transparent border-amber-400/40 shadow-[0_0_30px_-8px_rgba(251,191,36,0.55)]",
  "bg-gradient-to-b from-zinc-300/20 via-zinc-400/5 to-transparent border-zinc-300/30 shadow-[0_0_24px_-8px_rgba(212,212,216,0.35)]",
  "bg-gradient-to-b from-orange-600/25 via-orange-700/10 to-transparent border-orange-600/40 shadow-[0_0_24px_-8px_rgba(234,88,12,0.4)]",
];
// Classic podium order: 2nd, 1st, 3rd, left to right.
const DISPLAY_ORDER = [1, 0, 2];

export default function Podium({ standings }: { standings: Standing[] }) {
  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);
  if (top3.length === 0) return null;

  // Alphabetical, not rank order -- colors need to stay tied to each
  // player's identity, not shift around as the leaderboard re-sorts.
  const allNames = standings
    .map((s) => s.player.name)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-end justify-center gap-3">
        {DISPLAY_ORDER.filter((i) => i < top3.length).map((i) => {
          const s = top3[i];
          return (
            <div key={s.player.id} className="flex flex-col items-center gap-1.5">
              <span
                className="text-2xl"
                style={i === 0 ? { animation: "glow-pulse 2.4s ease-in-out infinite" } : undefined}
              >
                {MEDALS[i]}
              </span>
              <div className={`rounded-full ring-2 ${RING_STYLES[i]}`}>
                <StatsAvatar
                  playerId={s.player.id}
                  name={s.player.name}
                  avatarUrl={s.player.avatar_url}
                  size={i === 0 ? 60 : 46}
                  color={colorForKey(s.player.name, allNames)}
                />
              </div>
              <span className="max-w-20 truncate text-sm font-semibold text-zinc-100">
                {s.player.name}
              </span>
              <span className="text-xs text-zinc-500">{s.total} pts</span>
              <div
                style={{ height: HEIGHTS[i] }}
                className={`w-20 rounded-t-2xl border-t border-x backdrop-blur-sm ${BLOCK_STYLES[i]}`}
              />
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {rest.map((s, idx) => (
            <div
              key={s.player.id}
              className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 py-1.5 pl-1.5 pr-3"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                {idx + 4}
              </span>
              <StatsAvatar
                playerId={s.player.id}
                name={s.player.name}
                avatarUrl={s.player.avatar_url}
                size={28}
                color={colorForKey(s.player.name, allNames)}
              />
              <span className="text-sm font-medium text-zinc-200">{s.player.name}</span>
              <span className="text-xs text-zinc-500">{s.total} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

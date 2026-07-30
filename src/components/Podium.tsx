import StatsAvatar from "@/components/StatsAvatar";
import type { Player } from "@/lib/data";

type Standing = { player: Player; total: number };

const HEIGHTS = [88, 64, 48];
const MEDALS = ["🥇", "🥈", "🥉"];
const BLOCK_STYLES = [
  "bg-[#c9a227]/20 border-[#c9a227]/50",
  "bg-white/10 border-white/20",
  "bg-[#a35b2f]/20 border-[#a35b2f]/50",
];
// Classic podium order: 2nd, 1st, 3rd, left to right.
const DISPLAY_ORDER = [1, 0, 2];

export default function Podium({ standings }: { standings: Standing[] }) {
  const top3 = standings.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-3">
      {DISPLAY_ORDER.filter((i) => i < top3.length).map((i) => {
        const s = top3[i];
        return (
          <div key={s.player.id} className="flex flex-col items-center gap-1">
            <span className="text-2xl">{MEDALS[i]}</span>
            <StatsAvatar
              playerId={s.player.id}
              name={s.player.name}
              avatarUrl={s.player.avatar_url}
              size={i === 0 ? 56 : 44}
            />
            <span className="text-sm font-semibold max-w-20 truncate">
              {s.player.name}
            </span>
            <span className="text-xs text-black/60 dark:text-white/60">
              {s.total} pts
            </span>
            <div
              style={{ height: HEIGHTS[i] }}
              className={`w-20 rounded-t-lg border-t border-x ${BLOCK_STYLES[i]}`}
            />
          </div>
        );
      })}
    </div>
  );
}

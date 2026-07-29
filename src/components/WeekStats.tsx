import Avatar from "@/components/Avatar";
import WeeklyChart from "@/components/WeeklyChart";
import { MISS_SCORE } from "@/lib/constants";
import type { Player } from "@/lib/data";

type Standing = {
  player: Player;
  daily: { date: string; guesses: number | null }[];
  total: number;
};

export default function WeekStats({
  standings,
  hasScores,
  today,
}: {
  standings: Standing[];
  hasScores: boolean;
  today: string;
}) {
  return (
    <>
      <WeeklyChart standings={standings} today={today} />

      <div>
        <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
        <ol className="space-y-2">
          {standings.map((s, i) => {
            const medal = hasScores ? ["🏆", "🥈", "🥉"][i] : undefined;
            return (
              <li
                key={s.player.id}
                className={`flex items-center justify-between rounded-md border px-4 py-2.5 transition-transform ${
                  i === 0 && hasScores
                    ? "border-[#6aaa64]/50 bg-[#6aaa64]/5 scale-[1.02]"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                <span className="flex items-center gap-3 font-medium">
                  <Avatar
                    name={s.player.name}
                    avatarUrl={s.player.avatar_url}
                    size={36}
                  />
                  {s.player.name}
                  {medal && <span className="text-lg">{medal}</span>}
                </span>
                <span className="text-sm text-black/60 dark:text-white/60">
                  {s.total} pts
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-black/50 dark:text-white/50">
          Lowest total wins &mdash; a miss counts as {MISS_SCORE}.
        </p>
      </div>
    </>
  );
}

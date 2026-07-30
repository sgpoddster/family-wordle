import CompletionRing from "@/components/CompletionRing";
import Podium from "@/components/Podium";
import StatsAvatar from "@/components/StatsAvatar";
import StreakBadges from "@/components/StreakBadges";
import WeeklyChart from "@/components/WeeklyChart";
import { MISS_SCORE } from "@/lib/constants";
import type { Player, Streaks } from "@/lib/data";

type Standing = {
  player: Player;
  daily: { date: string; guesses: number | null }[];
  total: number;
};

export default function WeekStats({
  standings,
  hasScores,
  today,
  streaks,
}: {
  standings: Standing[];
  hasScores: boolean;
  today: string;
  streaks?: Map<string, Streaks>;
}) {
  const days = standings[0]?.daily.map((d) => d.date) ?? [];
  const fullyLoggedDays = days.filter((_, i) =>
    standings.every((s) => s.daily[i]?.guesses !== null)
  ).length;

  return (
    <>
      <WeeklyChart standings={standings} today={today} />

      {standings.length > 0 && (
        <div className="flex justify-center">
          <CompletionRing completed={fullyLoggedDays} />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
        <ol className="space-y-2">
          {standings.map((s, i) => {
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
                  <StatsAvatar
                    playerId={s.player.id}
                    name={s.player.name}
                    avatarUrl={s.player.avatar_url}
                    size={36}
                  />
                  {s.player.name}
                  {streaks && (
                    <StreakBadges
                      played={streaks.get(s.player.id)?.played ?? 0}
                      leader={streaks.get(s.player.id)?.leader ?? 0}
                    />
                  )}
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

      {hasScores && (
        <Podium standings={standings.map((s) => ({ player: s.player, total: s.total }))} />
      )}
    </>
  );
}

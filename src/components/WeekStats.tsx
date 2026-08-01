import CompletionRing from "@/components/CompletionRing";
import Podium from "@/components/Podium";
import StatsAvatar from "@/components/StatsAvatar";
import StreakBadges from "@/components/StreakBadges";
import WeeklyChart from "@/components/WeeklyChart";
import { MISS_SCORE, colorForKey } from "@/lib/constants";
import { hasJoinedBy, type Player, type Streaks } from "@/lib/data";

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
  completeThrough,
}: {
  standings: Standing[];
  hasScores: boolean;
  today: string;
  streaks?: Map<string, Streaks>;
  completeThrough?: string;
}) {
  const days = standings[0]?.daily.map((d) => d.date) ?? [];
  const fullyLoggedDays = days.filter((date, i) => {
    const expected = standings.filter(
      (s) =>
        hasJoinedBy(s.player, date) ||
        s.daily.slice(0, i).some((d) => d.guesses !== null)
    );
    return (
      expected.length > 0 &&
      expected.every((s) => s.daily[i]?.guesses !== null)
    );
  }).length;
  const asOfLabel =
    completeThrough && days.includes(completeThrough)
      ? new Date(completeThrough + "T00:00:00").toLocaleDateString(undefined, {
          weekday: "long",
        })
      : null;
  // Alphabetical, not rank order -- colors need to stay tied to each
  // player's identity, not shift around as the leaderboard re-sorts.
  const allNames = standings
    .map((s) => s.player.name)
    .sort((a, b) => a.localeCompare(b));

  return (
    <>
      <WeeklyChart standings={standings} today={today} />

      {standings.length > 0 && (
        <div className="flex justify-center">
          <CompletionRing completed={fullyLoggedDays} />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-100">
          Leaderboard{asOfLabel && ` (as of ${asOfLabel})`}
        </h2>
        <ol className="space-y-2">
          {standings.map((s, i) => {
            return (
              <li
                key={s.player.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 transition-transform ${
                  i === 0 && hasScores
                    ? "scale-[1.02] border-emerald-400/40 bg-emerald-400/5 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/20"
                    : "border-zinc-800 bg-zinc-900/40"
                }`}
              >
                <span className="flex items-center gap-3 font-medium text-zinc-100">
                  <StatsAvatar
                    playerId={s.player.id}
                    name={s.player.name}
                    avatarUrl={s.player.avatar_url}
                    size={36}
                    color={colorForKey(s.player.name, allNames)}
                  />
                  {s.player.name}
                  {streaks && (
                    <StreakBadges
                      played={streaks.get(s.player.id)?.played ?? 0}
                      leader={streaks.get(s.player.id)?.leader ?? 0}
                    />
                  )}
                </span>
                <span className="text-sm text-zinc-400">{s.total} pts</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-zinc-500">
          Lowest total wins &mdash; a miss counts as {MISS_SCORE}.
        </p>
      </div>

      {hasScores && (
        <Podium standings={standings.map((s) => ({ player: s.player, total: s.total }))} />
      )}
    </>
  );
}

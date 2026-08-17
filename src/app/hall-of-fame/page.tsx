import Avatar from "@/components/Avatar";
import PerformanceOverTime from "@/components/PerformanceOverTime";
import { STATS_START_DATE } from "@/lib/constants";
import {
  addDays,
  computeStandings,
  getActivePlayers,
  getAllScores,
  getBestGreatDayRate,
  getBestWeekEver,
  getClosedWeeks,
  getWeekBounds,
  longestStreakEver,
  todayStr,
  type Player,
} from "@/lib/data";

export const dynamic = "force-dynamic";

function topEntry(counts: Map<string, number>): [string, number] | null {
  let top: [string, number] | null = null;
  for (const entry of counts) {
    if (!top || entry[1] > top[1]) top = entry;
  }
  return top;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function RecordCard({
  icon,
  label,
  player,
  detail,
  subDetail,
}: {
  icon: string;
  label: string;
  player: Player | undefined;
  detail: string;
  subDetail?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500">{label}</p>
        {player ? (
          <div className="mt-0.5 flex items-center gap-2">
            <Avatar name={player.name} avatarUrl={player.avatar_url} size={24} />
            <span className="truncate font-semibold text-zinc-100">
              {player.name}
            </span>
          </div>
        ) : (
          <p className="font-semibold text-zinc-600">Nobody yet</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm text-zinc-400">{detail}</span>
        {subDetail && <p className="text-xs text-zinc-600">{subDetail}</p>}
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-800/50 px-2.5 py-1.5 text-center">
      <p className="text-sm font-bold text-zinc-100">{value}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}

export default async function HallOfFamePage() {
  const [players, allScores, allWeeks] = await Promise.all([
    getActivePlayers(),
    getAllScores(),
    getClosedWeeks(),
  ]);
  const byId = (id: string | null) => players.find((p) => p.id === id);

  // All-time records only count from STATS_START_DATE onward -- excludes
  // early setup/test data from before the app was actually in real use.
  const scores = allScores.filter((s) => s.play_date >= STATS_START_DATE);
  const weeks = allWeeks.filter((w) => w.start_date >= STATS_START_DATE);

  // Real calendar weeks (Monday-Sunday) spanning from wherever the data
  // actually starts through today -- used for every "per week" stat below
  // instead of the `weeks` table's own row boundaries, which can be stale
  // (e.g. the very first row only spans 5 of its 7 real days, from before
  // weeks were calendar-aligned).
  const today = todayStr();
  const { monday: todayMonday } = getWeekBounds(today);
  const earliestScoreDate = scores.reduce(
    (min, s) => (s.play_date < min ? s.play_date : min),
    today
  );
  const dataStartMonday = getWeekBounds(earliestScoreDate).monday;
  const weekColumns: { monday: string; sunday: string }[] = [];
  for (let m = dataStartMonday; m <= todayMonday; m = addDays(m, 7)) {
    weekColumns.push({ monday: m, sunday: addDays(m, 6) });
  }
  const completedWeekColumns = weekColumns.filter((c) => c.sunday < today);

  const greatDayRate = getBestGreatDayRate(players, scores);
  const bestWeek = getBestWeekEver(players, weekColumns, scores, today);

  const streaks = players
    .map((p) => ({ player: p, streak: longestStreakEver(scores, p.id) }))
    .sort((a, b) => b.streak - a.streak);
  const topStreak = streaks[0];

  const weeksWon = new Map<string, number>();
  const comebacks = new Map<string, number>();
  const consistents = new Map<string, number>();
  for (const w of weeks) {
    if (w.winner_player_id) {
      weeksWon.set(w.winner_player_id, (weeksWon.get(w.winner_player_id) ?? 0) + 1);
    }
    if (w.comeback_player_id) {
      comebacks.set(
        w.comeback_player_id,
        (comebacks.get(w.comeback_player_id) ?? 0) + 1
      );
    }
    if (w.consistent_player_id) {
      consistents.set(
        w.consistent_player_id,
        (consistents.get(w.consistent_player_id) ?? 0) + 1
      );
    }
  }
  const topWeeksWon = topEntry(weeksWon);
  const topComeback = topEntry(comebacks);
  const topConsistent = topEntry(consistents);

  // Per-player summary: counts of 2s/3s, average weekly total (completed
  // calendar weeks only), average daily score (fails included, same as
  // everywhere else "a miss counts as 8").
  const playerSummaries = players.map((p) => {
    const own = scores.filter((s) => s.player_id === p.id);
    const twos = own.filter((s) => s.guesses === 2).length;
    const threes = own.filter((s) => s.guesses === 3).length;
    const avgDaily = own.length
      ? own.reduce((sum, s) => sum + s.guesses, 0) / own.length
      : null;
    const weeklyTotalsForPlayer = completedWeekColumns
      .map((col) => {
        const weekScores = own.filter(
          (s) => s.play_date >= col.monday && s.play_date <= col.sunday
        );
        const standings = computeStandings([p], weekScores, col.monday, col.sunday);
        return standings[0]?.hasStarted ? standings[0].total : undefined;
      })
      .filter((t): t is number => t !== undefined);
    const avgWeekly = weeklyTotalsForPlayer.length
      ? weeklyTotalsForPlayer.reduce((a, b) => a + b, 0) /
        weeklyTotalsForPlayer.length
      : null;
    return { player: p, twos, threes, avgDaily, avgWeekly };
  });

  // "Performance over time" grid: trimmed to start where real data begins
  // (not a fixed lookback that pads out with empty weeks), capped at a
  // 12-week visible viewport with the rest reachable by scrolling back.
  const weeklyTotals: Record<string, (number | null)[]> = {};
  for (const p of players) {
    weeklyTotals[p.id] = weekColumns.map((col) => {
      const through = today < col.sunday ? today : col.sunday;
      const weekScores = scores.filter(
        (s) =>
          s.player_id === p.id &&
          s.play_date >= col.monday &&
          s.play_date <= through
      );
      const standings = computeStandings([p], weekScores, col.monday, through);
      return standings[0]?.hasStarted ? standings[0].total : null;
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
          Hall of Fame
        </h1>
        <p className="text-sm text-zinc-400">
          All-time records &mdash; these never reset.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <RecordCard
          icon="⭐"
          label="Most 2s & 3s"
          player={greatDayRate?.player}
          detail={
            greatDayRate
              ? `${greatDayRate.pct.toFixed(0)}% (${greatDayRate.count}/${greatDayRate.total})`
              : "—"
          }
        />
        <RecordCard
          icon="🥶"
          label="Lowest weekly score"
          player={bestWeek?.player}
          detail={bestWeek ? `${bestWeek.total} pts · ${(bestWeek.total / 7).toFixed(2)} avg` : "—"}
          subDetail={
            bestWeek
              ? `${formatDate(bestWeek.weekStart)} – ${formatDate(bestWeek.weekEnd)}`
              : undefined
          }
        />
        <RecordCard
          icon="🔥"
          label="Longest streak ever"
          player={topStreak && topStreak.streak > 0 ? topStreak.player : undefined}
          detail={topStreak && topStreak.streak > 0 ? `${topStreak.streak} days` : "—"}
        />
        <RecordCard
          icon="🏆"
          label="Most weeks won"
          player={topWeeksWon ? byId(topWeeksWon[0]) : undefined}
          detail={topWeeksWon ? `${topWeeksWon[1]} weeks` : "—"}
        />
        <RecordCard
          icon="📈"
          label="Most Comeback of the Week"
          player={topComeback ? byId(topComeback[0]) : undefined}
          detail={topComeback ? `${topComeback[1]}x` : "—"}
        />
        <RecordCard
          icon="🎯"
          label="Most Mr/Ms Consistent"
          player={topConsistent ? byId(topConsistent[0]) : undefined}
          detail={topConsistent ? `${topConsistent[1]}x` : "—"}
        />
      </div>

      {players.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">
              Player breakdown
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {playerSummaries.map(({ player, twos, threes, avgDaily, avgWeekly }) => (
                <div
                  key={player.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Avatar name={player.name} avatarUrl={player.avatar_url} size={24} />
                    <span className="font-semibold text-zinc-100">{player.name}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <StatChip label="2s" value={String(twos)} />
                    <StatChip label="3s" value={String(threes)} />
                    <StatChip
                      label="wk avg"
                      value={avgWeekly !== null ? avgWeekly.toFixed(1) : "—"}
                    />
                    <StatChip
                      label="day avg"
                      value={avgDaily !== null ? avgDaily.toFixed(1) : "—"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">
              Performance over time
            </h2>
            <PerformanceOverTime
              players={players}
              scores={scores}
              weekColumns={weekColumns}
              weeklyTotals={weeklyTotals}
              today={today}
            />
          </div>
        </div>
      )}
    </div>
  );
}

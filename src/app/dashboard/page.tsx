import EndWeekButton from "@/components/EndWeekButton";
import WeekStats from "@/components/WeekStats";
import {
  addDays,
  computeStandings,
  computeStreaks,
  computeWeekStandings,
  getActivePlayers,
  getActiveWeek,
  getRecentScores,
  getScoresForWeek,
  getWeekBounds,
  todayStr,
} from "@/lib/data";

export default async function DashboardPage() {
  const [players, week] = await Promise.all([
    getActivePlayers(),
    getActiveWeek(),
  ]);
  const scores = await getScoresForWeek(week.id);
  const today = todayStr();
  const { monday, sunday } = getWeekBounds(today);
  const standings = computeWeekStandings(players, scores, today);
  const hasScores = standings.some((s) =>
    s.daily.some((d) => d.guesses !== null)
  );
  const recentScores = await getRecentScores(addDays(today, -60));
  const streaks = computeStreaks(players, recentScores, today);
  // The manually-tracked period (matches what endWeek() settles server-side),
  // which can differ from the Mon-Sun display range above.
  const trackedPeriodStandings = computeStandings(
    players,
    scores,
    week.start_date,
    today
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">This week</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {formatDate(monday)} – {formatDate(sunday)}
          </p>
        </div>
        {players.length > 0 && (
          <EndWeekButton standings={trackedPeriodStandings} />
        )}
      </div>

      {players.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          Add family members on the Players page to start tracking.
        </p>
      ) : (
        <WeekStats
          standings={standings}
          hasScores={hasScores}
          today={today}
          streaks={streaks}
        />
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

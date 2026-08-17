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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [players, week] = await Promise.all([
    getActivePlayers(),
    getActiveWeek(),
  ]);
  const scores = await getScoresForWeek(week.id);
  const today = todayStr();
  const { monday, sunday } = getWeekBounds(today);
  const { standings, completeThrough } = computeWeekStandings(
    players,
    scores,
    today
  );
  const hasScores = standings.some((s) =>
    s.daily.some((d) => d.guesses !== null)
  );
  const recentScores = await getRecentScores(addDays(today, -60));
  const streaks = computeStreaks(players, recentScores, today);

  // The currently-open week row can be stale -- from an earlier calendar
  // week that never got explicitly ended before rolling over. When that
  // happens, surface its own bounded stats separately so it can be reviewed
  // and closed out, instead of silently vanishing from "this week"'s view
  // (which only ever shows the calendar week containing today).
  const openWeekBounds = getWeekBounds(week.start_date);
  const isStaleWeek = openWeekBounds.monday !== monday;
  const staleThrough = today < openWeekBounds.sunday ? today : openWeekBounds.sunday;
  const staleStandings = isStaleWeek
    ? computeStandings(players, scores, week.start_date, staleThrough)
    : null;
  const staleHasScores =
    staleStandings?.some((s) => s.daily.some((d) => d.guesses !== null)) ??
    false;

  // The manually-tracked period (matches what endWeek() settles server-side)
  // for the normal, non-stale case.
  const trackedPeriodStandings = computeStandings(
    players,
    scores,
    week.start_date,
    today < sunday ? today : sunday
  );

  return (
    <div className="space-y-12">
      {isStaleWeek && staleStandings && (
        <div className="space-y-8 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
                Finish last week
              </h1>
              <p className="text-sm text-zinc-400">
                {formatDate(openWeekBounds.monday)} –{" "}
                {formatDate(openWeekBounds.sunday)} was never ended
              </p>
            </div>
            <EndWeekButton standings={staleStandings} />
          </div>
          <WeekStats
            standings={staleStandings}
            hasScores={staleHasScores}
            today={today}
            streaks={streaks}
            completeThrough={staleThrough}
          />
        </div>
      )}

      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              This week
            </h1>
            <p className="text-sm text-zinc-400">
              {formatDate(monday)} – {formatDate(sunday)}
            </p>
          </div>
          {!isStaleWeek && players.length > 0 && (
            <EndWeekButton standings={trackedPeriodStandings} />
          )}
        </div>

        {players.length === 0 ? (
          <p className="text-zinc-400">
            Add family members on the Players page to start tracking.
          </p>
        ) : (
          <WeekStats
            standings={standings}
            hasScores={hasScores}
            today={today}
            streaks={streaks}
            completeThrough={completeThrough}
          />
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

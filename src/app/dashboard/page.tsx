import EndWeekButton from "@/components/EndWeekButton";
import WeekStats from "@/components/WeekStats";
import {
  computeWeekStandings,
  getActivePlayers,
  getActiveWeek,
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">This week</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {formatDate(monday)} – {formatDate(sunday)}
          </p>
        </div>
        {players.length > 0 && <EndWeekButton />}
      </div>

      {players.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          Add family members on the Players page to start tracking.
        </p>
      ) : (
        <WeekStats standings={standings} hasScores={hasScores} today={today} />
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

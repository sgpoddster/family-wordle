import EndWeekButton from "@/components/EndWeekButton";
import WeekStats from "@/components/WeekStats";
import {
  addDays,
  computeStandings,
  getActivePlayers,
  getActiveWeek,
  getScoresForWeek,
  todayStr,
} from "@/lib/data";

export default async function DashboardPage() {
  const [players, week] = await Promise.all([
    getActivePlayers(),
    getActiveWeek(),
  ]);
  const scores = await getScoresForWeek(week.id);
  const today = todayStr();
  const weekHasStarted = week.start_date <= today;
  const standings = computeStandings(
    players,
    scores,
    week.start_date,
    weekHasStarted ? today : addDays(week.start_date, -1)
  );
  const displayStart = standings[0]?.daily[0]?.date ?? week.start_date;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">This week</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {weekHasStarted
              ? `${formatDate(displayStart)} – ${formatDate(today)}`
              : `Starts ${formatDate(week.start_date)}`}
          </p>
        </div>
        {players.length > 0 && <EndWeekButton />}
      </div>

      {players.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          Add family members on the Players page to start tracking.
        </p>
      ) : (
        <WeekStats standings={standings} weekHasStarted={weekHasStarted} />
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

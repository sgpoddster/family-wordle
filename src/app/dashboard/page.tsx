import Avatar from "@/components/Avatar";
import EndWeekButton from "@/components/EndWeekButton";
import WeeklyChart from "@/components/WeeklyChart";
import {
  MISS_SCORE,
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">This week</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {weekHasStarted
              ? `${formatDate(week.start_date)} – ${formatDate(today)}`
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
        <>
          <WeeklyChart standings={standings} />

          <div>
            <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
            <ol className="space-y-2">
              {standings.map((s, i) => {
                const medal = weekHasStarted
                  ? ["🏆", "🥈", "🥉"][i]
                  : undefined;
                return (
                  <li
                    key={s.player.id}
                    className={`flex items-center justify-between rounded-md border px-4 py-2.5 transition-transform ${
                      i === 0 && weekHasStarted
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

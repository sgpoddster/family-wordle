import ScoreForm from "@/components/ScoreForm";
import WeekStats from "@/components/WeekStats";
import {
  MISS_SCORE,
  computeWeekStandings,
  getActivePlayers,
  getActiveWeek,
  getScoresForWeek,
  todayStr,
} from "@/lib/data";

export default async function EntryPage() {
  const [players, week] = await Promise.all([
    getActivePlayers(),
    getActiveWeek(),
  ]);
  const scores = await getScoresForWeek(week.id);
  const today = todayStr();
  const standings = computeWeekStandings(players, scores, today);

  if (players.length === 0) {
    return (
      <div className="text-center text-black/60 dark:text-white/60">
        <p>No family members yet.</p>
        <a href="/players" className="underline">
          Add someone on the Players page
        </a>{" "}
        to get started.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Log a score</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Lower is better &mdash; a fail or a missed day counts as{" "}
            {MISS_SCORE}.
          </p>
        </div>

        <ScoreForm players={players} today={today} />
      </div>

      <div className="space-y-8 border-t border-black/10 dark:border-white/10 pt-8">
        <h2 className="text-xl font-bold">This week so far</h2>
        <WeekStats
          standings={standings}
          hasScores={standings.some((s) =>
            s.daily.some((d) => d.guesses !== null)
          )}
          today={today}
        />
      </div>
    </div>
  );
}

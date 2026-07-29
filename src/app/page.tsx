import { submitScore } from "@/app/actions";
import Avatar from "@/components/Avatar";
import DateField from "@/components/DateField";
import { colorForKey } from "@/lib/constants";
import {
  MISS_SCORE,
  getActivePlayers,
  getActiveWeek,
  getScoresForWeek,
  todayStr,
} from "@/lib/data";

const GUESS_OPTIONS = [1, 2, 3, 4, 5, 6];

export default async function EntryPage() {
  const [players, week] = await Promise.all([
    getActivePlayers(),
    getActiveWeek(),
  ]);
  const scores = await getScoresForWeek(week.id);
  const today = todayStr();
  const todaysScores = new Map(
    scores.filter((s) => s.play_date === today).map((s) => [s.player_id, s])
  );

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Log a score</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Lower is better &mdash; a fail or a missed day counts as{" "}
          {MISS_SCORE}.
        </p>
      </div>

      <form action={submitScore} className="space-y-6">
        <fieldset>
          <legend className="block text-sm font-medium mb-2">
            Who&apos;s playing?
          </legend>
          <div className="flex flex-wrap gap-3">
            {players.map((p, i) => (
              <label key={p.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="playerId"
                  value={p.id}
                  defaultChecked={i === 0}
                  className="peer sr-only"
                  required
                />
                <div
                  style={{ "--ring": colorForKey(p.name) } as React.CSSProperties}
                  className="flex flex-col items-center gap-1 rounded-lg border-2 border-transparent p-2 peer-checked:border-[var(--ring)] peer-checked:bg-black/5 dark:peer-checked:bg-white/10 transition-colors"
                >
                  <Avatar name={p.name} avatarUrl={p.avatar_url} size={52} />
                  <span className="text-xs font-medium max-w-16 truncate">
                    {p.name}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <DateField today={today} />

        <fieldset>
          <legend className="block text-sm font-medium mb-2">
            Guesses to solve it
          </legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {GUESS_OPTIONS.map((n) => (
              <label key={n} className="cursor-pointer">
                <input
                  type="radio"
                  name="guesses"
                  value={n}
                  defaultChecked={n === 4}
                  className="peer sr-only"
                  required
                />
                <div className="flex h-12 items-center justify-center rounded-md border border-black/15 dark:border-white/20 font-bold peer-checked:bg-[#6aaa64] peer-checked:text-white peer-checked:border-[#6aaa64] peer-checked:scale-105 transition-all">
                  {n}
                </div>
              </label>
            ))}
            <label className="cursor-pointer col-span-4 sm:col-span-3">
              <input
                type="radio"
                name="guesses"
                value="fail"
                className="peer sr-only"
                required
              />
              <div className="flex h-12 items-center justify-center rounded-md border border-black/15 dark:border-white/20 font-bold peer-checked:bg-[#787c7e] peer-checked:text-white peer-checked:border-[#787c7e] transition-colors">
                Failed / didn&apos;t play
              </div>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-md bg-[#6aaa64] py-2.5 font-semibold text-white hover:bg-[#5a9654] transition-colors"
        >
          Save score
        </button>
      </form>

      <div>
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60 mb-2">
          Today so far
        </h2>
        <ul className="space-y-2 text-sm">
          {players.map((p) => {
            const score = todaysScores.get(p.id);
            return (
              <li key={p.id} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Avatar name={p.name} avatarUrl={p.avatar_url} size={28} />
                  {p.name}
                </span>
                <span className="text-black/60 dark:text-white/60">
                  {score
                    ? score.guesses >= MISS_SCORE
                      ? "Failed"
                      : `${score.guesses} guesses`
                    : "Not logged yet"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

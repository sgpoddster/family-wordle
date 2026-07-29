import { submitScore } from "@/app/actions";
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
        <h1 className="text-2xl font-bold">Log today&apos;s score</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Lower is better &mdash; a fail or a missed day counts as{" "}
          {MISS_SCORE}.
        </p>
      </div>

      <form action={submitScore} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="playerId">
            Who&apos;s playing?
          </label>
          <select
            id="playerId"
            name="playerId"
            required
            className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="playDate">
            Date
          </label>
          <input
            id="playDate"
            name="playDate"
            type="date"
            defaultValue={today}
            max={today}
            required
            className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
          />
        </div>

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
                <div className="flex h-12 items-center justify-center rounded-md border border-black/15 dark:border-white/20 font-bold peer-checked:bg-[#6aaa64] peer-checked:text-white peer-checked:border-[#6aaa64] transition-colors">
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
        <ul className="space-y-1 text-sm">
          {players.map((p) => {
            const score = todaysScores.get(p.id);
            return (
              <li key={p.id} className="flex justify-between">
                <span>{p.name}</span>
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

import Avatar from "@/components/Avatar";
import ShareWeekButton from "@/components/ShareWeekButton";
import { colorForKey, MISS_SCORE } from "@/lib/constants";
import {
  computeStandings,
  getAllPlayers,
  getAllScores,
  getClosedWeeks,
} from "@/lib/data";

export const dynamic = "force-dynamic";

const NAIL_BITER_MARGIN = 2;
const MEDALS = ["🥇", "🥈", "🥉"];

function tileEmoji(guesses: number | null): string {
  if (guesses === null || guesses >= MISS_SCORE) return "⬛";
  if (guesses <= 2) return "🟩";
  if (guesses <= 4) return "🟨";
  return "🟧";
}

function buildShareText(
  week: { start_date: string; end_date: string | null },
  standings: { player: { name: string }; daily: { guesses: number | null }[]; total: number }[]
): string {
  const range = `${formatDate(week.start_date)}–${
    week.end_date ? formatDate(week.end_date) : "?"
  }`;
  const lines = [`🏆 The Wordle Cup — ${range}`];
  standings.forEach((s, i) => {
    const medal = MEDALS[i] ?? `${i + 1}.`;
    const squares = s.daily.map((d) => tileEmoji(d.guesses)).join("");
    lines.push(`${medal} ${s.player.name} (${s.total}): ${squares}`);
  });
  return lines.join("\n");
}

export default async function HistoryPage() {
  const [weeks, players, allScores] = await Promise.all([
    getClosedWeeks(),
    getAllPlayers(),
    getAllScores(),
  ]);

  // Bound by play_date, not week_id: a score is tagged with whichever week
  // was active at submission time, which can lag behind its actual date if
  // "End Week" wasn't clicked promptly -- a week's own real scores can end
  // up filed under an earlier week's id. Date-range filtering finds them
  // regardless of which id they're stuck under.
  const weeksWithStats = weeks.map((w) => {
    const endDate = w.end_date;
    if (!endDate) return { week: w, standings: null, shareText: null };
    const scores = allScores.filter(
      (s) => s.play_date >= w.start_date && s.play_date <= endDate
    );
    const standings = computeStandings(players, scores, w.start_date, endDate);
    return { week: w, standings, shareText: buildShareText(w, standings) };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
        History
      </h1>

      {weeks.length === 0 ? (
        <p className="text-zinc-400">
          No weeks finished yet &mdash; click &quot;End Week&quot; on the
          Dashboard once the week is done.
        </p>
      ) : (
        <ol className="space-y-4">
          {weeksWithStats.map(({ week: w, standings, shareText }) => {
            const isNailBiter =
              w.margin !== null && w.margin <= NAIL_BITER_MARGIN;
            const allNames =
              standings?.map((s) => s.player.name).sort((a, b) => a.localeCompare(b)) ?? [];
            return (
              <li
                key={w.id}
                className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-zinc-100">
                    {formatDate(w.start_date)} &ndash;{" "}
                    {w.end_date ? formatDate(w.end_date) : "?"}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 text-sm">
                      {w.winner_name ? (
                        <>
                          <Avatar
                            name={w.winner_name}
                            avatarUrl={w.winner_avatar_url}
                            size={28}
                            color={colorForKey(w.winner_name, allNames)}
                          />
                          <span className="font-semibold text-zinc-100">
                            {w.winner_name}
                          </span>
                          <span className="text-lg">🏆</span>
                        </>
                      ) : (
                        <span className="text-zinc-500">No winner</span>
                      )}
                    </span>
                    {shareText && <ShareWeekButton text={shareText} />}
                  </div>
                </div>

                {(w.comeback_name || w.consistent_name || isNailBiter) && (
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {w.comeback_name && (
                      <span className="rounded-full bg-purple-500/15 text-purple-300 px-2.5 py-1 font-medium">
                        📈 Comeback of the Week: {w.comeback_name}
                      </span>
                    )}
                    {w.consistent_name && (
                      <span className="rounded-full bg-blue-500/15 text-blue-300 px-2.5 py-1 font-medium">
                        🎯 Mr/Ms Consistent: {w.consistent_name}
                      </span>
                    )}
                    {isNailBiter && (
                      <span className="rounded-full bg-red-500/15 text-red-300 px-2.5 py-1 font-medium">
                        😬 Nail-biter finish
                      </span>
                    )}
                  </div>
                )}

                {standings && standings.length > 0 && (
                  <div className="space-y-1.5 border-t border-zinc-800 pt-3">
                    {standings.map((s, i) => {
                      const color = colorForKey(s.player.name, allNames);
                      return (
                        <div
                          key={s.player.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="w-4 shrink-0 text-xs text-zinc-500">
                              {i + 1}
                            </span>
                            <Avatar
                              name={s.player.name}
                              avatarUrl={s.player.avatar_url}
                              size={22}
                              color={color}
                            />
                            <span className="truncate font-medium text-zinc-200">
                              {s.player.name}
                            </span>
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="hidden tracking-tight sm:inline">
                              {s.daily.map((d) => tileEmoji(d.guesses)).join("")}
                            </span>
                            <span className="w-14 shrink-0 text-right text-zinc-400">
                              {s.total} pts
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

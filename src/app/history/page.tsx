import Avatar from "@/components/Avatar";
import ShareWeekButton from "@/components/ShareWeekButton";
import {
  MISS_SCORE,
  computeStandings,
  getAllPlayers,
  getClosedWeeks,
  getScoresForWeek,
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
  const [weeks, players] = await Promise.all([getClosedWeeks(), getAllPlayers()]);

  const weeksWithShare = await Promise.all(
    weeks.map(async (w) => {
      if (!w.end_date) return { week: w, shareText: null };
      const scores = await getScoresForWeek(w.id);
      const standings = computeStandings(players, scores, w.start_date, w.end_date);
      return { week: w, shareText: buildShareText(w, standings) };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">History</h1>

      {weeks.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          No weeks finished yet &mdash; click &quot;End Week&quot; on the
          Dashboard once the week is done.
        </p>
      ) : (
        <ol className="space-y-3">
          {weeksWithShare.map(({ week: w, shareText }) => {
            const isNailBiter =
              w.margin !== null && w.margin <= NAIL_BITER_MARGIN;
            return (
              <li
                key={w.id}
                className="rounded-md border border-black/10 dark:border-white/10 px-4 py-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
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
                          />
                          <span className="font-semibold">{w.winner_name}</span>
                          <span className="text-lg">🏆</span>
                        </>
                      ) : (
                        <span className="text-black/50 dark:text-white/50">
                          No winner
                        </span>
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

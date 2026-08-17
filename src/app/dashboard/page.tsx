import Link from "next/link";
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
  getWeekBounds,
  todayStr,
} from "@/lib/data";

export const dynamic = "force-dynamic";

function isValidDateStr(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const today = todayStr();
  const { monday: todayMonday } = getWeekBounds(today);

  // Any date within the target week works -- getWeekBounds normalizes it to
  // that week's Monday. Clamp so you can never navigate into the future.
  const requested =
    weekParam && isValidDateStr(weekParam) ? weekParam : today;
  let { monday, sunday } = getWeekBounds(requested);
  if (monday > todayMonday) {
    ({ monday, sunday } = getWeekBounds(today));
  }
  const isCurrentWeek = monday === todayMonday;

  const [players, openWeek, recentScores] = await Promise.all([
    getActivePlayers(),
    getActiveWeek(),
    // From this viewed week's Monday onward covers any week being browsed,
    // however far back -- one lean, targeted fetch instead of a fixed window.
    getRecentScores(monday),
  ]);
  const weekScores = recentScores.filter((s) => s.play_date <= sunday);

  // Past weeks are fully settled -- every day counts, blanks included, no
  // "wait for everyone to log in" freeze. Only the current week freezes.
  const { standings, completeThrough } = isCurrentWeek
    ? computeWeekStandings(players, weekScores, today)
    : {
        standings: computeStandings(players, weekScores, monday, sunday),
        completeThrough: sunday,
      };
  const hasScores = standings.some((s) =>
    s.daily.some((d) => d.guesses !== null)
  );

  // The open (unclosed) week row can be from an earlier calendar week than
  // whatever's being viewed here, or than today -- either way, show the End
  // Week button only when the viewed week IS the one that's actually open.
  const openWeekBounds = getWeekBounds(openWeek.start_date);
  const isOpenWeek = openWeekBounds.monday === monday;
  const openWeekIsStale = openWeekBounds.monday !== todayMonday;

  const streakScores = await getRecentScores(addDays(today, -60));
  const streaks = isCurrentWeek
    ? computeStreaks(players, streakScores, today)
    : undefined;

  return (
    <div className="space-y-8">
      {isCurrentWeek && openWeekIsStale && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
          The week of {formatDate(openWeekBounds.monday)} –{" "}
          {formatDate(openWeekBounds.sunday)} was never ended.{" "}
          <Link
            href={`/dashboard?week=${openWeekBounds.monday}`}
            className="font-semibold underline hover:text-amber-100"
          >
            Go finish it
          </Link>
          .
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard?week=${addDays(monday, -7)}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="Previous week"
          >
            &larr;
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              {isCurrentWeek ? "This week" : "Week of " + formatDate(monday)}
            </h1>
            <p className="text-sm text-zinc-400">
              {formatDate(monday)} – {formatDate(sunday)}
            </p>
          </div>
          {isCurrentWeek ? (
            <span className="ml-1 h-9 w-9" />
          ) : (
            <Link
              href={`/dashboard?week=${addDays(monday, 7)}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
              aria-label="Next week"
            >
              &rarr;
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isCurrentWeek && (
            <Link
              href="/dashboard"
              className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900"
            >
              This week
            </Link>
          )}
          {isOpenWeek && players.length > 0 && (
            <EndWeekButton standings={standings} />
          )}
        </div>
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
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

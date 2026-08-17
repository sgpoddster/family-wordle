import Avatar from "@/components/Avatar";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import {
  getActivePlayers,
  getAllScores,
  getBestDayEver,
  getBestWeekEver,
  getClosedWeeks,
  longestStreakEver,
  type Player,
} from "@/lib/data";

export const dynamic = "force-dynamic";

function topEntry(counts: Map<string, number>): [string, number] | null {
  let top: [string, number] | null = null;
  for (const entry of counts) {
    if (!top || entry[1] > top[1]) top = entry;
  }
  return top;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function RecordCard({
  icon,
  label,
  player,
  detail,
  subDetail,
}: {
  icon: string;
  label: string;
  player: Player | undefined;
  detail: string;
  subDetail?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500">{label}</p>
        {player ? (
          <div className="mt-0.5 flex items-center gap-2">
            <Avatar name={player.name} avatarUrl={player.avatar_url} size={24} />
            <span className="truncate font-semibold text-zinc-100">
              {player.name}
            </span>
          </div>
        ) : (
          <p className="font-semibold text-zinc-600">Nobody yet</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm text-zinc-400">{detail}</span>
        {subDetail && <p className="text-xs text-zinc-600">{subDetail}</p>}
      </div>
    </div>
  );
}

export default async function HallOfFamePage() {
  const [players, scores, weeks] = await Promise.all([
    getActivePlayers(),
    getAllScores(),
    getClosedWeeks(),
  ]);
  const byId = (id: string | null) => players.find((p) => p.id === id);

  const bestDay = getBestDayEver(scores);
  const bestWeek = getBestWeekEver(players, weeks, scores);

  const streaks = players
    .map((p) => ({ player: p, streak: longestStreakEver(scores, p.id) }))
    .sort((a, b) => b.streak - a.streak);
  const topStreak = streaks[0];

  const weeksWon = new Map<string, number>();
  const comebacks = new Map<string, number>();
  const consistents = new Map<string, number>();
  for (const w of weeks) {
    if (w.winner_player_id) {
      weeksWon.set(w.winner_player_id, (weeksWon.get(w.winner_player_id) ?? 0) + 1);
    }
    if (w.comeback_player_id) {
      comebacks.set(
        w.comeback_player_id,
        (comebacks.get(w.comeback_player_id) ?? 0) + 1
      );
    }
    if (w.consistent_player_id) {
      consistents.set(
        w.consistent_player_id,
        (consistents.get(w.consistent_player_id) ?? 0) + 1
      );
    }
  }
  const topWeeksWon = topEntry(weeksWon);
  const topComeback = topEntry(comebacks);
  const topConsistent = topEntry(consistents);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
          Hall of Fame
        </h1>
        <p className="text-sm text-zinc-400">
          All-time records &mdash; these never reset.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <RecordCard
          icon="⭐"
          label="Best day ever"
          player={bestDay ? byId(bestDay.player_id) : undefined}
          detail={bestDay ? `${bestDay.guesses} guesses` : "—"}
        />
        <RecordCard
          icon="🥶"
          label="Lowest weekly score"
          player={bestWeek?.player}
          detail={bestWeek ? `${bestWeek.total} pts · ${(bestWeek.total / 7).toFixed(2)} avg` : "—"}
          subDetail={
            bestWeek
              ? `${formatDate(bestWeek.week.start_date)} – ${formatDate(bestWeek.week.end_date!)}`
              : undefined
          }
        />
        <RecordCard
          icon="🔥"
          label="Longest streak ever"
          player={topStreak && topStreak.streak > 0 ? topStreak.player : undefined}
          detail={topStreak && topStreak.streak > 0 ? `${topStreak.streak} days` : "—"}
        />
        <RecordCard
          icon="🏆"
          label="Most weeks won"
          player={topWeeksWon ? byId(topWeeksWon[0]) : undefined}
          detail={topWeeksWon ? `${topWeeksWon[1]} weeks` : "—"}
        />
        <RecordCard
          icon="📈"
          label="Most Comeback of the Week"
          player={topComeback ? byId(topComeback[0]) : undefined}
          detail={topComeback ? `${topComeback[1]}x` : "—"}
        />
        <RecordCard
          icon="🎯"
          label="Most Mr/Ms Consistent"
          player={topConsistent ? byId(topConsistent[0]) : undefined}
          detail={topConsistent ? `${topConsistent[1]}x` : "—"}
        />
      </div>

      {players.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">
            Performance over time
          </h2>
          <div className="space-y-2 overflow-x-auto pb-2">
            {players.map((p) => (
              <CalendarHeatmap key={p.id} player={p} scores={scores} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

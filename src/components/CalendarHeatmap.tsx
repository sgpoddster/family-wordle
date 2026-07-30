import { MISS_SCORE } from "@/lib/constants";
import {
  addDays,
  getWeekBounds,
  todayStr,
  type Player,
  type Score,
} from "@/lib/data";

function cellColor(guesses: number | undefined): string {
  if (guesses === undefined) return "rgba(127,127,127,0.1)";
  if (guesses >= MISS_SCORE) return "#8b3a3a";
  const hue = 120 - (guesses - 1) * 22;
  return `hsl(${hue}, 55%, 38%)`;
}

export default function CalendarHeatmap({
  player,
  scores,
  weeks = 12,
}: {
  player: Player;
  scores: Score[];
  weeks?: number;
}) {
  const byDate = new Map(
    scores.filter((s) => s.player_id === player.id).map((s) => [s.play_date, s.guesses])
  );

  const { monday: thisWeekMonday } = getWeekBounds(todayStr());
  const startMonday = addDays(thisWeekMonday, -(weeks - 1) * 7);
  const columns = Array.from({ length: weeks }, (_, w) => {
    const colStart = addDays(startMonday, w * 7);
    return Array.from({ length: 7 }, (_, d) => addDays(colStart, d));
  });

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium w-16 shrink-0 truncate">
        {player.name}
      </span>
      <div className="flex gap-[3px] overflow-x-auto">
        {columns.map((col, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {col.map((date) => (
              <div
                key={date}
                title={`${date}${byDate.has(date) ? `: ${byDate.get(date)}` : ""}`}
                style={{ backgroundColor: cellColor(byDate.get(date)) }}
                className="w-3 h-3 rounded-[2px]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

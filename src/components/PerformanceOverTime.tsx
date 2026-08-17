"use client";

import { useEffect, useRef } from "react";
import Avatar from "@/components/Avatar";
import { MISS_SCORE, colorForKey, hasJoinedBy } from "@/lib/constants";
import type { Player, Score } from "@/lib/data";

const VISIBLE_WEEKS = 12;
const NAME_COL_WIDTH = 104;
const WEEK_COL_WIDTH = 56;

type WeekColumn = { monday: string; sunday: string };

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function cellColor(guesses: number | undefined): string {
  if (guesses === undefined) return "rgba(127,127,127,0.12)";
  if (guesses >= MISS_SCORE) return "#8b3a3a";
  const hue = 120 - (guesses - 1) * 22;
  return `hsl(${hue}, 55%, 38%)`;
}

export default function PerformanceOverTime({
  players,
  scores,
  weekColumns,
  weeklyTotals,
  today,
}: {
  players: Player[];
  scores: Score[];
  weekColumns: WeekColumn[];
  /** weeklyTotals[playerId][weekIndex] -- null where that week doesn't
   * apply yet (player hadn't joined, or it's entirely in the future). */
  weeklyTotals: Record<string, (number | null)[]>;
  today: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weekColumns.length]);

  const allNames = players.map((p) => p.name).sort((a, b) => a.localeCompare(b));
  const byDateByPlayer = new Map<string, Map<string, number>>();
  for (const s of scores) {
    if (!byDateByPlayer.has(s.player_id)) byDateByPlayer.set(s.player_id, new Map());
    byDateByPlayer.get(s.player_id)!.set(s.play_date, s.guesses);
  }

  if (weekColumns.length === 0) {
    return <p className="text-sm text-zinc-500">No scores logged yet.</p>;
  }

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto pb-2"
      style={{ maxWidth: NAME_COL_WIDTH + VISIBLE_WEEKS * WEEK_COL_WIDTH }}
    >
      <div className="flex">
        <div
          className="sticky left-0 z-10 shrink-0 bg-zinc-950"
          style={{ width: NAME_COL_WIDTH }}
        />
        {weekColumns.map((col) => (
          <div
            key={col.monday}
            className="shrink-0 border-l border-zinc-800/60 text-center text-[10px] text-zinc-500"
            style={{ width: WEEK_COL_WIDTH }}
          >
            {formatDate(col.monday)}
          </div>
        ))}
      </div>

      {players.map((p) => {
        const color = colorForKey(p.name, allNames);
        const own = byDateByPlayer.get(p.id) ?? new Map<string, number>();
        return (
          <div key={p.id} className="flex items-center">
            <div
              className="sticky left-0 z-10 flex shrink-0 items-center gap-1.5 overflow-hidden bg-zinc-950 pr-2"
              style={{ width: NAME_COL_WIDTH }}
            >
              <Avatar name={p.name} avatarUrl={p.avatar_url} size={20} color={color} />
              <span className="min-w-0 truncate text-xs font-medium text-zinc-300">
                {p.name}
              </span>
            </div>
            {weekColumns.map((col, i) => {
              const days = Array.from({ length: 7 }, (_, d) => addDays(col.monday, d));
              const total = weeklyTotals[p.id]?.[i] ?? null;
              return (
                <div
                  key={col.monday}
                  className="flex shrink-0 flex-col items-center gap-0.5 border-l border-zinc-800/60 py-1"
                  style={{ width: WEEK_COL_WIDTH }}
                >
                  <div className="flex gap-[2px]">
                    {days.map((date) => {
                      const real = own.get(date);
                      const isPast = date < today;
                      const guesses =
                        real ?? (isPast && hasJoinedBy(p, date) ? MISS_SCORE : undefined);
                      return (
                        <div
                          key={date}
                          title={`${date}${real !== undefined ? `: ${real}` : ""}`}
                          style={{ backgroundColor: cellColor(guesses) }}
                          className="h-3 w-3 rounded-[2px]"
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-zinc-600">{total ?? ""}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

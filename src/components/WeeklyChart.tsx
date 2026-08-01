"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import Avatar from "@/components/Avatar";
import { MISS_SCORE, colorForKey, hasJoinedBy } from "@/lib/constants";
import type { Player } from "@/lib/data";

type Standing = {
  player: Player;
  daily: { date: string; guesses: number | null }[];
};

type DayBar = {
  date: string;
  value: number;
  assumed: boolean;
  blank: boolean;
};

type ShapeProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  payload?: DayBar;
};

function weekdayLabel(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
  });
}

// `assumed` (hasn't logged yet, we're just guessing a miss because the day's
// past) draws hollow/dashed with a "?" so it never looks like a real,
// confirmed fail (solid bar, "X"). The value label is drawn as part of the
// same shape rather than via Bar's separate `label` prop, which doesn't
// reliably receive `payload` in this recharts version.
function makeBarShape(color: string) {
  return function BarShape({ x, y, width, height, payload }: ShapeProps) {
    if (
      !payload ||
      payload.blank ||
      x === undefined ||
      y === undefined ||
      width === undefined ||
      height === undefined
    ) {
      return null;
    }
    const rectX = Number(x);
    const rectY = Number(y);
    const rectWidth = Number(width);
    const rectHeight = Number(height);
    const aboveLabel = payload.assumed
      ? "?"
      : payload.value >= MISS_SCORE
        ? "X"
        : payload.value;
    const insideEmoji = payload.assumed
      ? null
      : payload.value >= MISS_SCORE
        ? "😢"
        : payload.value === 2 || payload.value === 3
          ? "😊"
          : null;
    return (
      <g>
        <rect
          x={rectX}
          y={rectY}
          width={rectWidth}
          height={rectHeight}
          rx={4}
          fill={payload.assumed ? "none" : color}
          stroke={payload.assumed ? color : undefined}
          strokeWidth={payload.assumed ? 2 : 0}
          strokeDasharray={payload.assumed ? "4 3" : undefined}
        />
        <text
          x={rectX + rectWidth / 2}
          y={rectY - 6}
          textAnchor="middle"
          fontSize={13}
          fontWeight="bold"
          fill={color}
        >
          {aboveLabel}
        </text>
        {insideEmoji && (
          <text
            x={rectX + rectWidth / 2}
            y={rectY + rectHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
          >
            {insideEmoji}
          </text>
        )}
      </g>
    );
  };
}

export default function WeeklyChart({
  standings,
  today,
}: {
  standings: Standing[];
  today: string;
}) {
  if (standings.length === 0 || standings[0].daily.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        No scores logged yet this week.
      </p>
    );
  }

  // Alphabetical, not rank order -- colors need to stay tied to each
  // player's identity, not shift around as the leaderboard re-sorts.
  const allNames = standings
    .map((s) => s.player.name)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <p className="text-xs text-black/50 dark:text-white/50 mb-3">
        Taller bar = more guesses that day. A hollow{" "}
        <span className="font-semibold">?</span> means they haven&apos;t
        logged that day yet.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {standings.map((s) => {
          const color = colorForKey(s.player.name, allNames);
          const data: DayBar[] = s.daily.map((d, i) => {
            const label = weekdayLabel(d.date);
            if (d.guesses !== null) {
              return { date: label, value: d.guesses, assumed: false, blank: false };
            }
            const isPast = d.date < today;
            if (isPast) {
              // Was this player already around by this day? Either their
              // profile predates it, or they've got a real entry earlier
              // this week -- re-creating a player's row doesn't erase that
              // they were playing.
              const hasEarlierEntry = s.daily
                .slice(0, i)
                .some((x) => x.guesses !== null);
              if (hasJoinedBy(s.player, d.date) || hasEarlierEntry) {
                return { date: label, value: MISS_SCORE, assumed: true, blank: false };
              }
            }
            // today, future, or before this player joined: nothing to show.
            return { date: label, value: 0, assumed: false, blank: true };
          });

          return (
            <div
              key={s.player.id}
              className="rounded-lg border border-black/10 dark:border-white/10 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Avatar name={s.player.name} avatarUrl={s.player.avatar_url} size={24} />
                <span className="text-sm font-semibold" style={{ color }}>
                  {s.player.name}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "currentColor", opacity: 0.15 }}
                  />
                  <YAxis
                    domain={[0, MISS_SCORE]}
                    ticks={[1, MISS_SCORE]}
                    allowDecimals={false}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Bar
                    dataKey="value"
                    shape={makeBarShape(color)}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}

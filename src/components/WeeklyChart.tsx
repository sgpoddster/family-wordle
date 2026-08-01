"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

const BAR_RADIUS = 6;

function weekdayLabel(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
  });
}

// Path for a rectangle with only its top two corners rounded -- a plain
// SVG <rect rx> rounds all four, which looks wrong sitting on a baseline.
function roundedTopRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
}

// `assumed` (hasn't logged yet, we're just guessing a miss because the day's
// past) draws hollow/dashed with a "?" so it never looks like a real,
// confirmed fail. The actual emoji/detail lives in the Tooltip now, not
// crammed into the bar itself.
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
    const path = roundedTopRectPath(rectX, rectY, rectWidth, rectHeight, BAR_RADIUS);
    const label = payload.assumed
      ? "?"
      : payload.value >= MISS_SCORE
        ? "X"
        : payload.value;
    return (
      <g>
        <path
          d={path}
          fill={payload.assumed ? "none" : color}
          stroke={payload.assumed ? color : undefined}
          strokeWidth={payload.assumed ? 1.5 : 0}
          strokeDasharray={payload.assumed ? "4 3" : undefined}
          opacity={payload.assumed ? 0.7 : 1}
        />
        <text
          x={rectX + rectWidth / 2}
          y={rectY - 7}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          className="fill-zinc-400"
        >
          {label}
        </text>
      </g>
    );
  };
}

function ChartTooltip({
  active,
  payload,
  color,
}: {
  active?: boolean;
  payload?: { payload: DayBar }[];
  color: string;
}) {
  if (!active || !payload?.length) return null;
  const day = payload[0].payload;
  if (day.blank) return null;

  let detail: string;
  let emoji: string | null = null;
  if (day.assumed) {
    detail = "Not logged yet";
  } else if (day.value >= MISS_SCORE) {
    detail = "Failed";
    emoji = "😢";
  } else {
    detail = `${day.value} ${day.value === 1 ? "guess" : "guesses"}`;
    if (day.value === 2 || day.value === 3) emoji = "😊";
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/95 px-3 py-2 text-sm shadow-xl shadow-black/40 backdrop-blur">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-medium text-zinc-200">{day.date}</span>
      <span className="text-zinc-500">&middot;</span>
      <span className="text-zinc-300">{detail}</span>
      {emoji && <span>{emoji}</span>}
    </div>
  );
}

export default function WeeklyChart({
  standings,
  today,
}: {
  standings: Standing[];
  today: string;
}) {
  if (standings.length === 0 || standings[0].daily.length === 0) {
    return <p className="text-sm text-zinc-500">No scores logged yet this week.</p>;
  }

  // Alphabetical, not rank order -- colors need to stay tied to each
  // player's identity, not shift around as the leaderboard re-sorts.
  const allNames = standings
    .map((s) => s.player.name)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <p className="mb-3 text-xs text-zinc-500">
        Taller bar = more guesses that day. A hollow{" "}
        <span className="font-semibold text-zinc-400">?</span> means they
        haven&apos;t logged that day yet.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20"
            >
              <div className="mb-1 flex items-center gap-2">
                <Avatar
                  name={s.player.name}
                  avatarUrl={s.player.avatar_url}
                  size={24}
                  color={color}
                />
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
                    axisLine={false}
                    stroke="#71717a"
                  />
                  <YAxis
                    domain={[0, MISS_SCORE]}
                    ticks={[1, MISS_SCORE]}
                    allowDecimals={false}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="#71717a"
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    content={<ChartTooltip color={color} />}
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

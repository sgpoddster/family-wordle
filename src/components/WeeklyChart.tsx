"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Avatar from "@/components/Avatar";
import { MISS_SCORE, colorForKey, hasJoinedBy } from "@/lib/constants";
import type { Player } from "@/lib/data";

type Standing = {
  player: Player;
  daily: { date: string; guesses: number | null }[];
};

type DotProps = {
  cx?: number;
  cy?: number;
  value?: number;
  stroke?: string;
};

function ScoreDot({ cx, cy, value, stroke }: DotProps) {
  if (cx === undefined || cy === undefined || value === undefined) {
    return null;
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={13} fill={stroke} />
      <text
        x={cx}
        y={cy}
        dy={4}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        fill="#fff"
      >
        {value >= MISS_SCORE ? "X" : value}
      </text>
    </g>
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
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        No scores logged yet this week.
      </p>
    );
  }

  // Alphabetical, not rank order -- standings is sorted by current total, and
  // colors need to stay tied to each player's identity, not shift around as
  // the leaderboard re-sorts day to day.
  const allNames = standings
    .map((s) => s.player.name)
    .sort((a, b) => a.localeCompare(b));
  const dates = standings[0].daily.map((d) => d.date);
  const chartData = dates.map((date, i) => {
    const row: Record<string, string | number> = {
      date: new Date(date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "short",
      }),
    };
    const isPast = date < today;
    for (const s of standings) {
      const guesses = s.daily[i].guesses;
      if (guesses !== null) {
        row[s.player.name] = guesses;
      } else if (isPast) {
        // Was this player already around by this day? Either their profile
        // predates it, or they've got a real entry earlier this week --
        // re-creating a player's row doesn't erase that they were playing.
        const hasEarlierEntry = s.daily
          .slice(0, i)
          .some((d) => d.guesses !== null);
        if (hasJoinedBy(s.player, date) || hasEarlierEntry) {
          row[s.player.name] = MISS_SCORE;
        }
      }
      // today, future, or before this player joined: leave unset, so the
      // line simply doesn't extend there until they actually log -- no
      // point plotted, no premature or retroactive drop to a miss.
    }
    return row;
  });

  return (
    <div>
      <p className="text-xs text-black/50 dark:text-white/50 mb-1">
        Lower on the chart = better that day
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: -10 }}>
          <XAxis
            dataKey="date"
            fontSize={13}
            tickLine={false}
            axisLine={{ stroke: "currentColor", opacity: 0.15 }}
          />
          <YAxis
            domain={[1, MISS_SCORE]}
            reversed
            allowDecimals={false}
            fontSize={13}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1e1e1e",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          {standings.map((s) => {
            const color = colorForKey(s.player.name, allNames);
            return (
              <Line
                key={s.player.id}
                type="linear"
                dataKey={s.player.name}
                stroke={color}
                strokeWidth={3}
                connectNulls
                dot={<ScoreDot />}
                activeDot={<ScoreDot />}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {standings.map((s) => {
          const color = colorForKey(s.player.name, allNames);
          return (
            <span
              key={s.player.id}
              style={{
                backgroundColor: `${color}26`,
                borderColor: `${color}80`,
                color,
              }}
              className="flex items-center gap-1.5 rounded-full border pl-1 pr-3 py-1 text-sm font-semibold"
            >
              <Avatar
                name={s.player.name}
                avatarUrl={s.player.avatar_url}
                size={22}
              />
              {s.player.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

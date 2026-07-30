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
import { MISS_SCORE, colorForKey } from "@/lib/constants";
import type { Player } from "@/lib/data";

type Standing = {
  player: Player;
  daily: { date: string; guesses: number | null }[];
};

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

  const dates = standings[0].daily.map((d) => d.date);
  const lastValue: Record<string, number> = {};
  const chartData = dates.map((date, i) => {
    const row: Record<string, string | number> = {
      date: new Date(date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "short",
      }),
    };
    const isFuture = date > today;
    const isToday = date === today;
    for (const s of standings) {
      const guesses = s.daily[i].guesses;
      if (guesses !== null) {
        row[s.player.name] = guesses;
        lastValue[s.player.name] = guesses;
      } else if (isFuture) {
        // day hasn't happened yet at all -- leave unset, no point plotted
      } else if (isToday) {
        // today isn't over yet -- hold at yesterday's level instead of
        // dropping to a miss, rather than penalizing before the day ends
        if (lastValue[s.player.name] !== undefined) {
          row[s.player.name] = lastValue[s.player.name];
        }
      } else {
        row[s.player.name] = MISS_SCORE;
        lastValue[s.player.name] = MISS_SCORE;
      }
    }
    return row;
  });

  return (
    <div>
      <p className="text-xs text-black/50 dark:text-white/50 mb-1">
        Lower on the chart = better that day
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 12, right: 12, left: -20 }}>
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
            const color = colorForKey(s.player.name);
            return (
              <Line
                key={s.player.id}
                type="linear"
                dataKey={s.player.name}
                stroke={color}
                strokeWidth={3}
                connectNulls
                dot={{ r: 5, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 7, fill: color }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {standings.map((s) => {
          const color = colorForKey(s.player.name);
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

"use client";

import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MISS_SCORE, colorForKey } from "@/lib/constants";

type Standing = {
  player: { id: string; name: string };
  daily: { date: string; guesses: number | null }[];
};

export default function WeeklyChart({
  standings,
}: {
  standings: Standing[];
}) {
  if (standings.length === 0 || standings[0].daily.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        No scores logged yet this week.
      </p>
    );
  }

  const dates = standings[0].daily.map((d) => d.date);
  const chartData = dates.map((date, i) => {
    const row: Record<string, string | number> = {
      date: new Date(date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "short",
      }),
    };
    for (const s of standings) {
      row[s.player.name] = s.daily[i].guesses ?? MISS_SCORE;
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
          <Legend
            wrapperStyle={{ fontSize: 14, fontWeight: 600, paddingTop: 8 }}
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
    </div>
  );
}

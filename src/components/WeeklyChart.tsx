"use client";

import {
  CartesianGrid,
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
        month: "numeric",
        day: "numeric",
      }),
    };
    for (const s of standings) {
      row[s.player.name] = s.daily[i].guesses ?? MISS_SCORE;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis
          domain={[1, MISS_SCORE]}
          reversed
          allowDecimals={false}
          fontSize={12}
          label={{ value: "guesses (lower = better)", angle: -90, dx: 10, fontSize: 11 }}
        />
        <Tooltip />
        <Legend />
        {standings.map((s) => (
          <Line
            key={s.player.id}
            type="monotone"
            dataKey={s.player.name}
            stroke={colorForKey(s.player.name)}
            strokeWidth={2}
            connectNulls
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

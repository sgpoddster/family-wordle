import Avatar from "@/components/Avatar";
import { MISS_SCORE } from "@/lib/constants";
import type { Player } from "@/lib/data";

type Standing = {
  player: Player;
  daily: { date: string; guesses: number | null }[];
};

function tileStyle(guesses: number | null) {
  if (guesses === null) {
    return {
      bg: "rgba(127,127,127,0.12)",
      label: "–",
      color: "rgba(127,127,127,0.6)",
    };
  }
  if (guesses >= MISS_SCORE) {
    return { bg: "#8b3a3a", label: "X", color: "#fff" };
  }
  // 1 guess -> green (hue 120), 6 guesses -> red-orange (hue 10)
  const hue = 120 - (guesses - 1) * 22;
  return { bg: `hsl(${hue}, 55%, 42%)`, label: String(guesses), color: "#fff" };
}

function dayLabel(date: string) {
  const d = new Date(date + "T00:00:00");
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
    md: d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
  };
}

export default function TileGrid({ standings }: { standings: Standing[] }) {
  if (standings.length === 0 || standings[0].daily.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        No scores logged yet this week.
      </p>
    );
  }

  const days = standings[0].daily.map((d) => d.date);

  return (
    <div className="overflow-x-auto">
      <table className="border-separate [border-spacing:6px]">
        <thead>
          <tr>
            <th className="text-left" />
            {days.map((date) => {
              const { weekday, md } = dayLabel(date);
              return (
                <th
                  key={date}
                  className="text-xs font-medium text-black/50 dark:text-white/50 pb-1 w-12"
                >
                  <div>{weekday}</div>
                  <div className="font-normal">{md}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr key={s.player.id}>
              <td className="pr-2">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={s.player.name}
                    avatarUrl={s.player.avatar_url}
                    size={28}
                  />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {s.player.name}
                  </span>
                </div>
              </td>
              {s.daily.map(({ date, guesses }) => {
                const tile = tileStyle(guesses);
                return (
                  <td key={date}>
                    <div
                      style={{ backgroundColor: tile.bg, color: tile.color }}
                      className="w-12 h-12 rounded-md flex items-center justify-center font-extrabold text-lg"
                    >
                      {tile.label}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

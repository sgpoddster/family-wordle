"use client";

import { useState, useTransition } from "react";
import { getPlayerStats, type PlayerStats } from "@/app/actions";
import Avatar from "@/components/Avatar";

export default function StatsAvatar({
  playerId,
  name,
  avatarUrl,
  size = 36,
  color,
}: {
  playerId: string;
  name: string;
  avatarUrl: string | null;
  size?: number;
  color?: string;
}) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setOpen(true);
    if (!stats) {
      startTransition(async () => {
        setStats(await getPlayerStats(playerId));
      });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="shrink-0 rounded-full"
      >
        <Avatar name={name} avatarUrl={avatarUrl} size={size} color={color} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "pop-in 0.2s ease-out" }}
            className="w-full max-w-xs rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-6 text-center shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <Avatar name={name} avatarUrl={avatarUrl} size={72} color={color} />
              <p className="mt-3 text-xl font-bold text-white">{name}</p>
            </div>

            {isPending || !stats ? (
              <p className="mt-6 text-sm text-white/50">Loading stats…</p>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 text-left">
                  <Stat label="Best score" value={stats.bestScore ?? "–"} />
                  <Stat label="Average" value={stats.average ?? "–"} />
                  <Stat label="Games played" value={stats.gamesPlayed} />
                  <Stat label="Weeks won" value={stats.weeksWon} />
                  <Stat
                    label="Current streak"
                    value={stats.playedStreak > 0 ? `🔥 ${stats.playedStreak} days` : "–"}
                    full
                  />
                </div>

                <div className="mt-4 border-t border-zinc-800 pt-4 text-left">
                  <p className="text-xs text-white/50 mb-2">Trophy case</p>
                  {stats.weeksWon > 0 ||
                  stats.comebackAwards > 0 ||
                  stats.consistentAwards > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {stats.weeksWon > 0 && (
                        <TrophyBadge icon="🏆" count={stats.weeksWon} label="week win" />
                      )}
                      {stats.comebackAwards > 0 && (
                        <TrophyBadge
                          icon="📈"
                          count={stats.comebackAwards}
                          label="comeback"
                        />
                      )}
                      {stats.consistentAwards > 0 && (
                        <TrophyBadge
                          icon="🎯"
                          count={stats.consistentAwards}
                          label="consistent"
                        />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-white/40">No trophies yet &mdash; keep playing!</p>
                  )}
                </div>
              </>
            )}

            <button
              onClick={() => setOpen(false)}
              className="mt-6 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/30"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function TrophyBadge({
  icon,
  count,
  label,
}: {
  icon: string;
  count: number;
  label: string;
}) {
  return (
    <span
      title={`${count}x ${label}`}
      className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-sm font-semibold text-white"
    >
      {icon} {count}
    </span>
  );
}

function Stat({
  label,
  value,
  full,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`rounded-lg bg-white/5 px-3 py-2 ${full ? "col-span-2" : ""}`}>
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

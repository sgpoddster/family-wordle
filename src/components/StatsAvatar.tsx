"use client";

import { useState, useTransition } from "react";
import { getPlayerStats, type PlayerStats } from "@/app/actions";
import Avatar from "@/components/Avatar";

export default function StatsAvatar({
  playerId,
  name,
  avatarUrl,
  size = 36,
}: {
  playerId: string;
  name: string;
  avatarUrl: string | null;
  size?: number;
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
        <Avatar name={name} avatarUrl={avatarUrl} size={size} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "pop-in 0.2s ease-out" }}
            className="w-full max-w-xs rounded-2xl bg-[#1e1e1e] px-6 py-6 text-center shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <Avatar name={name} avatarUrl={avatarUrl} size={72} />
              <p className="mt-3 text-xl font-bold text-white">{name}</p>
            </div>

            {isPending || !stats ? (
              <p className="mt-6 text-sm text-white/50">Loading stats…</p>
            ) : (
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
            )}

            <button
              onClick={() => setOpen(false)}
              className="mt-6 rounded-md bg-[#6aaa64] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a9654] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
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

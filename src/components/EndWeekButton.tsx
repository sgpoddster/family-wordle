"use client";

import { useState } from "react";
import { endWeek } from "@/app/actions";
import Avatar from "@/components/Avatar";
import Confetti from "@/components/Confetti";
import type { Player } from "@/lib/data";

type Standing = { player: Player; total: number };

export default function EndWeekButton({
  standings,
  weekId,
  isClosed,
}: {
  standings: Standing[];
  weekId?: string;
  isClosed?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [phase, setPhase] = useState<"idle" | "drumroll" | "reveal" | "error">(
    "idle"
  );
  const winner = standings[0]?.player;

  async function start() {
    setConfirming(false);
    setPhase("drumroll");
    const [outcome] = await Promise.all([
      endWeek(weekId).then(
        () => "reveal" as const,
        () => "error" as const
      ),
      new Promise((resolve) => setTimeout(resolve, 1200)), // minimum drumroll time
    ]);
    setPhase(outcome);
  }

  if (phase !== "idle") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
        <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-10 text-center shadow-2xl">
          {phase === "drumroll" ? (
            <p className="animate-pulse text-xl font-semibold text-zinc-100">
              🥁 Tallying up the results…
            </p>
          ) : phase === "error" ? (
            <>
              <p className="text-xl font-semibold text-zinc-100">
                😬 Something went wrong
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                {isClosed
                  ? "The week couldn&apos;t be recalculated"
                  : "The week wasn&apos;t ended"}{" "}
                &mdash; please try again.
              </p>
              <button
                onClick={() => setPhase("idle")}
                className="mt-6 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/30"
              >
                Okay
              </button>
            </>
          ) : (
            <>
              <Confetti count={50} />
              {winner && (
                <div
                  style={{ animation: "bounce-in 0.5s ease-out" }}
                  className="flex flex-col items-center gap-3"
                >
                  <Avatar name={winner.name} avatarUrl={winner.avatar_url} size={72} />
                  <p className="text-2xl font-bold text-zinc-100">
                    🏆 {winner.name} {isClosed ? "wins!" : "wins the week!"}
                  </p>
                </div>
              )}
              <button
                onClick={() => setPhase("idle")}
                className="mt-6 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/30"
              >
                Nice!
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900"
      >
        {isClosed ? "Recalculate winner" : "End Week"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-300">
      <span>
        {isClosed
          ? "Redo the winner and awards with the latest scores?"
          : "Lock in the winner and start a new week?"}
      </span>
      <button
        onClick={start}
        className="rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 px-3 py-1.5 font-medium text-white shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
      >
        {isClosed ? "Yes, recalculate" : "Yes, end it"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-full px-3 py-1.5 font-medium text-zinc-400 transition-colors hover:bg-zinc-900"
      >
        Cancel
      </button>
    </div>
  );
}

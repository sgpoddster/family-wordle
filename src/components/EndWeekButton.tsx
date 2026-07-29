"use client";

import { useState } from "react";
import { endWeek } from "@/app/actions";
import Avatar from "@/components/Avatar";
import Confetti from "@/components/Confetti";
import type { Player } from "@/lib/data";

type Standing = { player: Player; total: number };

export default function EndWeekButton({
  standings,
}: {
  standings: Standing[];
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
      endWeek().then(
        () => "reveal" as const,
        () => "error" as const
      ),
      new Promise((resolve) => setTimeout(resolve, 1200)), // minimum drumroll time
    ]);
    setPhase(outcome);
  }

  if (phase !== "idle") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="relative w-full max-w-xs overflow-hidden rounded-2xl bg-[#1e1e1e] px-6 py-10 text-center shadow-2xl">
          {phase === "drumroll" ? (
            <p className="animate-pulse text-xl font-semibold text-white">
              🥁 Tallying up the results…
            </p>
          ) : phase === "error" ? (
            <>
              <p className="text-xl font-semibold text-white">
                😬 Something went wrong
              </p>
              <p className="mt-2 text-sm text-white/60">
                The week wasn&apos;t ended &mdash; please try again.
              </p>
              <button
                onClick={() => setPhase("idle")}
                className="mt-6 rounded-md bg-[#6aaa64] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a9654] transition-colors"
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
                  <p className="text-2xl font-bold text-white">
                    🏆 {winner.name} wins the week!
                  </p>
                </div>
              )}
              <button
                onClick={() => setPhase("idle")}
                className="mt-6 rounded-md bg-[#6aaa64] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a9654] transition-colors"
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
        className="rounded-md border border-black/15 dark:border-white/20 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        End Week
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span>Lock in the winner and start a new week?</span>
      <button
        onClick={start}
        className="rounded-md bg-[#6aaa64] px-3 py-1.5 font-medium text-white hover:bg-[#5a9654] transition-colors"
      >
        Yes, end it
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-md px-3 py-1.5 font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

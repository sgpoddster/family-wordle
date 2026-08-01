"use client";

import { useEffect, useState } from "react";
import Confetti from "@/components/Confetti";
import { MISS_SCORE } from "@/lib/constants";
import type { SubmitScoreResult } from "@/app/actions";

const GREAT = ["🤯 Genius!", "🔥 Incredible!", "⭐ Nailed it!", "🎯 Bullseye!"];
const GOOD = ["😎 Nice one!", "👍 Solid guess!", "✅ Well played!"];
const CLOSE = ["😅 Cutting it close!", "😬 Phew, made it!", "🙈 Just in time!"];
const FAIL = [
  "😩 Rough one!",
  "💀 Ouch, better luck tomorrow!",
  "🫠 Not your day!",
];

function pickMessage(guesses: number): string {
  const pool =
    guesses <= 2 ? GREAT : guesses <= 4 ? GOOD : guesses < MISS_SCORE ? CLOSE : FAIL;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function ReactionPopup({
  result,
  onDone,
}: {
  result: SubmitScoreResult;
  onDone: () => void;
}) {
  const [message] = useState(() => pickMessage(result.guesses));

  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const celebrate = result.guesses <= 2;

  return (
    <div
      onClick={onDone}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div
        style={{ animation: "pop-in 0.25s ease-out" }}
        className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-8 text-center shadow-2xl"
      >
        {celebrate && <Confetti count={30} />}
        <p className="text-2xl font-bold text-zinc-100">{message}</p>

        {result.leaderChanged && (
          <p className="mt-3 text-base font-semibold text-emerald-400">
            👑 {result.newLeaderName} takes the lead!
          </p>
        )}
        {!result.leaderChanged && result.closeRace && (
          <p className="mt-3 text-base font-semibold text-amber-400">
            😱 It&apos;s neck and neck at the top!
          </p>
        )}
      </div>
    </div>
  );
}

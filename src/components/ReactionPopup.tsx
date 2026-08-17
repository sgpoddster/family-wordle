"use client";

import { useEffect, useState } from "react";
import Confetti from "@/components/Confetti";
import type { SubmitScoreResult } from "@/app/actions";

const ONE = [
  "🤯 SENSATIONAL. One guess?!",
  "🐐 Absolute unit. First try.",
  "🔮 Are you psychic?",
  "🚀 Straight to orbit. One guess.",
  "👑 Bow down. One-guess royalty.",
];
const TWO = [
  "🔥 Woah. Amazing.",
  "😲 Two guesses?! Show off.",
  "⚡ Lightning fast.",
  "🎯 Ridiculously good.",
  "🧠 Big brain energy.",
];
const THREE = [
  "💪 Very good!",
  "✅ Clean and efficient.",
  "👏 Nicely done.",
  "🌟 Very solid work.",
  "😌 Textbook.",
];
const FOUR = [
  "🙂 Solid. Very average, very fine.",
  "👍 Gets the job done.",
  "😐 Perfectly respectable.",
  "📈 Right down the middle.",
  "🤷 It'll do.",
];
const FIVE = [
  "😬 Eh, scraped through.",
  "😅 Cutting it close there.",
  "🫠 Meh. It counts though.",
  "😩 Rough patch, but you made it.",
  "🥴 Barely.",
];
const SIX = [
  "😰 Yikes, right at the wire.",
  "🙃 That was NOT pretty.",
  "😵‍💫 Squeaked by on the last guess.",
  "🫣 Painful to watch, but a win's a win.",
  "😮‍💨 Phew. Barely made it out alive.",
];
const FAIL = [
  "💀 Disastrous.",
  "🫠 Total wipeout.",
  "🙈 Couldn't even look.",
  "☠️ Catastrophic. Try again tomorrow.",
  "😭 Rock bottom. There's always tomorrow.",
];

const POOLS: Record<number, string[]> = {
  1: ONE,
  2: TWO,
  3: THREE,
  4: FOUR,
  5: FIVE,
  6: SIX,
};

function pickMessage(guesses: number): string {
  const pool = POOLS[guesses] ?? FAIL;
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
      </div>
    </div>
  );
}

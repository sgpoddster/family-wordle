"use client";

import { useState } from "react";

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

function label(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  if (dateStr === addDays(today, -1)) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
  });
}

export default function DateField({ today }: { today: string }) {
  const quickDates = [0, -1, -2, -3].map((offset) => addDays(today, offset));
  const [selected, setSelected] = useState(today);
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">Date</label>
      <input type="hidden" name="playDate" value={selected} />
      <div className="flex flex-wrap gap-2">
        {quickDates.map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => {
              setSelected(date);
              setShowCustom(false);
            }}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              !showCustom && selected === date
                ? "border-transparent bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/40"
            }`}
          >
            {label(date, today)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
            showCustom
              ? "border-transparent bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/40"
          }`}
        >
          Older…
        </button>
      </div>
      {showCustom && (
        <input
          type="date"
          autoFocus
          value={selected}
          max={today}
          onChange={(e) => setSelected(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-zinc-100 [color-scheme:dark]"
        />
      )}
    </div>
  );
}

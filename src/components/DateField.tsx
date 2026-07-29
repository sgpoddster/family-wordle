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
      <label className="block text-sm font-medium mb-1">Date</label>
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
            className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              !showCustom && selected === date
                ? "bg-[#6aaa64] text-white border-[#6aaa64]"
                : "border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {label(date, today)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            showCustom
              ? "bg-[#6aaa64] text-white border-[#6aaa64]"
              : "border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
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
          className="mt-2 w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
        />
      )}
    </div>
  );
}

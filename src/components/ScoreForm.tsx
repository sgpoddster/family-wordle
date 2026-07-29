"use client";

import { useRef, useState, useTransition } from "react";
import { submitScore } from "@/app/actions";
import Avatar from "@/components/Avatar";
import DateField from "@/components/DateField";
import { colorForKey } from "@/lib/constants";
import type { Player } from "@/lib/data";

const GUESS_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function ScoreForm({
  players,
  today,
}: {
  players: Player[];
  today: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaved(false);
    startTransition(async () => {
      await submitScore(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <fieldset>
        <legend className="block text-sm font-medium mb-2">
          Who&apos;s playing?
        </legend>
        <div className="flex flex-wrap gap-3">
          {players.map((p, i) => (
            <label key={p.id} className="cursor-pointer">
              <input
                type="radio"
                name="playerId"
                value={p.id}
                defaultChecked={i === 0}
                className="peer sr-only"
                required
              />
              <div
                style={{ "--ring": colorForKey(p.name) } as React.CSSProperties}
                className="flex flex-col items-center gap-1 rounded-lg border-2 border-transparent p-2 peer-checked:border-[var(--ring)] peer-checked:bg-black/5 dark:peer-checked:bg-white/10 transition-colors"
              >
                <Avatar name={p.name} avatarUrl={p.avatar_url} size={52} />
                <span className="text-xs font-medium max-w-16 truncate">
                  {p.name}
                </span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <DateField today={today} />

      <fieldset>
        <legend className="block text-sm font-medium mb-2">
          Guesses to solve it
        </legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {GUESS_OPTIONS.map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="guesses"
                value={n}
                defaultChecked={n === 4}
                className="peer sr-only"
                required
              />
              <div className="flex h-12 items-center justify-center rounded-md border border-black/15 dark:border-white/20 font-bold peer-checked:bg-[#6aaa64] peer-checked:text-white peer-checked:border-[#6aaa64] peer-checked:scale-105 transition-all">
                {n}
              </div>
            </label>
          ))}
          <label className="cursor-pointer col-span-4 sm:col-span-3">
            <input
              type="radio"
              name="guesses"
              value="fail"
              className="peer sr-only"
              required
            />
            <div className="flex h-12 items-center justify-center rounded-md border border-black/15 dark:border-white/20 font-bold peer-checked:bg-[#787c7e] peer-checked:text-white peer-checked:border-[#787c7e] transition-colors">
              Failed / didn&apos;t play
            </div>
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className={`w-full rounded-md py-2.5 font-semibold text-white transition-colors disabled:opacity-70 ${
          saved ? "bg-[#538d4e]" : "bg-[#6aaa64] hover:bg-[#5a9654]"
        }`}
      >
        {isPending ? "Saving…" : saved ? "Saved ✓" : "Save score"}
      </button>
    </form>
  );
}

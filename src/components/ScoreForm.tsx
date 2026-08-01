"use client";

import { useRef, useState, useTransition } from "react";
import { submitScore, type SubmitScoreResult } from "@/app/actions";
import Avatar from "@/components/Avatar";
import DateField from "@/components/DateField";
import ReactionPopup from "@/components/ReactionPopup";
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
  const [reaction, setReaction] = useState<SubmitScoreResult | null>(null);
  const [flipping, setFlipping] = useState<string | null>(null);

  function flipTile(value: string) {
    setFlipping(value);
    setTimeout(() => setFlipping((v) => (v === value ? null : v)), 400);
  }

  const allNames = players.map((p) => p.name);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaved(false);
    startTransition(async () => {
      const result = await submitScore(formData);
      setSaved(true);
      setReaction(result);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-7">
      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-zinc-300">
          Who&apos;s playing?
        </legend>
        <div className="flex flex-wrap gap-3">
          {players.map((p, i) => {
            const color = colorForKey(p.name, allNames);
            return (
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
                  style={
                    {
                      "--ring": color,
                      "--ring-bg": `${color}1a`,
                    } as React.CSSProperties
                  }
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 transition-all peer-checked:border-transparent peer-checked:bg-[var(--ring-bg)] peer-checked:shadow-lg peer-checked:ring-2 peer-checked:ring-[var(--ring)] peer-checked:ring-offset-2 peer-checked:ring-offset-zinc-950 hover:bg-zinc-800/40"
                >
                  <Avatar name={p.name} avatarUrl={p.avatar_url} size={52} color={color} />
                  <span className="max-w-16 truncate text-xs font-medium text-zinc-200">
                    {p.name}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <DateField today={today} />

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-zinc-300">
          Guesses to solve it
        </legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {GUESS_OPTIONS.map((n) => (
            <label
              key={n}
              className="cursor-pointer"
              style={{ perspective: "300px" }}
            >
              <input
                type="radio"
                name="guesses"
                value={n}
                defaultChecked={n === 4}
                className="peer sr-only"
                required
                onClick={() => flipTile(String(n))}
              />
              <div
                style={
                  flipping === String(n)
                    ? { animation: "tile-flip 0.4s ease-in-out" }
                    : undefined
                }
                className="flex h-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 font-bold text-zinc-200 transition-all peer-checked:scale-105 peer-checked:border-transparent peer-checked:bg-gradient-to-b peer-checked:from-emerald-400 peer-checked:to-emerald-600 peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-emerald-500/30 peer-checked:ring-2 peer-checked:ring-emerald-400 peer-checked:ring-offset-2 peer-checked:ring-offset-zinc-950 hover:bg-zinc-800/40"
              >
                {n}
              </div>
            </label>
          ))}
          <label
            className="col-span-4 cursor-pointer sm:col-span-3"
            style={{ perspective: "300px" }}
          >
            <input
              type="radio"
              name="guesses"
              value="fail"
              className="peer sr-only"
              required
              onClick={() => flipTile("fail")}
            />
            <div
              style={
                flipping === "fail"
                  ? { animation: "tile-flip 0.4s ease-in-out" }
                  : undefined
              }
              className="flex h-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 font-bold text-zinc-200 transition-all peer-checked:border-transparent peer-checked:bg-gradient-to-b peer-checked:from-rose-400 peer-checked:to-rose-600 peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-rose-500/30 peer-checked:ring-2 peer-checked:ring-rose-400 peer-checked:ring-offset-2 peer-checked:ring-offset-zinc-950 hover:bg-zinc-800/40"
            >
              Failed / didn&apos;t play
            </div>
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className={`w-full rounded-xl py-3 font-semibold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${
          saved
            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20"
            : "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-emerald-500/20 hover:-translate-y-0.5 hover:shadow-emerald-500/30 active:translate-y-0 active:shadow-md"
        }`}
      >
        {isPending ? "Saving…" : saved ? "Saved ✓" : "Save score"}
      </button>

      {reaction && (
        <ReactionPopup result={reaction} onDone={() => setReaction(null)} />
      )}
    </form>
  );
}

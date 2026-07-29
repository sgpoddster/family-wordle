"use client";

import { useState, useTransition } from "react";
import { endWeek } from "@/app/actions";

export default function EndWeekButton() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

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
        disabled={isPending}
        onClick={() => startTransition(() => endWeek())}
        className="rounded-md bg-[#6aaa64] px-3 py-1.5 font-medium text-white hover:bg-[#5a9654] transition-colors disabled:opacity-60"
      >
        {isPending ? "Ending..." : "Yes, end it"}
      </button>
      <button
        disabled={isPending}
        onClick={() => setConfirming(false)}
        className="rounded-md px-3 py-1.5 font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

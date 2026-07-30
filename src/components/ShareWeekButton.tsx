"use client";

import { useState } from "react";

export default function ShareWeekButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs rounded-full border border-black/15 dark:border-white/20 px-3 py-1 font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
    >
      {copied ? "Copied! 📋" : "📋 Share"}
    </button>
  );
}

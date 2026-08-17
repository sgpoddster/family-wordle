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
      className="text-xs rounded-full border border-zinc-800 px-3 py-1 font-medium text-zinc-300 hover:bg-zinc-900 transition-colors"
    >
      {copied ? "Copied! 📋" : "📋 Share"}
    </button>
  );
}

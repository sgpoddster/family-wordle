"use client";

import { useState } from "react";
import { PLAYER_COLORS } from "@/lib/constants";

export default function Confetti({ count = 40 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.2 + Math.random() * 0.9,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      rotate: Math.random() * 360,
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
          className="absolute top-0 h-3 w-2 rounded-sm"
        />
      ))}
    </div>
  );
}

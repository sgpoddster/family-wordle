const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CompletionRing({
  completed,
  total = 7,
}: {
  completed: number;
  total?: number;
}) {
  const pct = Math.min(completed / total, 1);
  const offset = CIRCUMFERENCE * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle
          cx={36}
          cy={36}
          r={RADIUS}
          fill="none"
          stroke="#27272a"
          strokeWidth={6}
        />
        <circle
          cx={36}
          cy={36}
          r={RADIUS}
          fill="none"
          stroke="#34d399"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
        />
        <text
          x={36}
          y={41}
          textAnchor="middle"
          className="fill-zinc-100 text-sm font-bold"
        >
          {completed}/{total}
        </text>
      </svg>
      <span className="text-xs text-zinc-500">days everyone played</span>
    </div>
  );
}

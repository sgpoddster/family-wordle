export default function StreakBadges({
  played,
  leader,
}: {
  played: number;
  leader: number;
}) {
  if (played < 2 && leader < 2) return null;

  return (
    <span className="flex items-center gap-1.5 text-xs font-bold">
      {played >= 2 && (
        <span title={`${played}-day play streak`} className="text-orange-400">
          🔥{played}
        </span>
      )}
      {leader >= 2 && (
        <span title={`${leader}-day lead streak`} className="text-yellow-400">
          ⚡{leader}
        </span>
      )}
    </span>
  );
}

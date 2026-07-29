import Avatar from "@/components/Avatar";
import { getClosedWeeks } from "@/lib/data";

const NAIL_BITER_MARGIN = 2;

export default async function HistoryPage() {
  const weeks = await getClosedWeeks();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">History</h1>

      {weeks.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          No weeks finished yet &mdash; click &quot;End Week&quot; on the
          Dashboard once the week is done.
        </p>
      ) : (
        <ol className="space-y-3">
          {weeks.map((w) => {
            const isNailBiter =
              w.margin !== null && w.margin <= NAIL_BITER_MARGIN;
            return (
              <li
                key={w.id}
                className="rounded-md border border-black/10 dark:border-white/10 px-4 py-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {formatDate(w.start_date)} &ndash;{" "}
                    {w.end_date ? formatDate(w.end_date) : "?"}
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    {w.winner_name ? (
                      <>
                        <Avatar
                          name={w.winner_name}
                          avatarUrl={w.winner_avatar_url}
                          size={28}
                        />
                        <span className="font-semibold">{w.winner_name}</span>
                        <span className="text-lg">🏆</span>
                      </>
                    ) : (
                      <span className="text-black/50 dark:text-white/50">
                        No winner
                      </span>
                    )}
                  </span>
                </div>

                {(w.comeback_name || w.consistent_name || isNailBiter) && (
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {w.comeback_name && (
                      <span className="rounded-full bg-purple-500/15 text-purple-300 px-2.5 py-1 font-medium">
                        📈 Comeback of the Week: {w.comeback_name}
                      </span>
                    )}
                    {w.consistent_name && (
                      <span className="rounded-full bg-blue-500/15 text-blue-300 px-2.5 py-1 font-medium">
                        🎯 Mr/Ms Consistent: {w.consistent_name}
                      </span>
                    )}
                    {isNailBiter && (
                      <span className="rounded-full bg-red-500/15 text-red-300 px-2.5 py-1 font-medium">
                        😬 Nail-biter finish
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

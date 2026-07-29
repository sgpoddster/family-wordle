import { getClosedWeeks } from "@/lib/data";

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
          {weeks.map((w) => (
            <li
              key={w.id}
              className="rounded-md border border-black/10 dark:border-white/10 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {formatDate(w.start_date)} &ndash;{" "}
                  {w.end_date ? formatDate(w.end_date) : "?"}
                </span>
                <span className="text-sm">
                  {w.winner_name ? (
                    <>
                      🏆 <span className="font-semibold">{w.winner_name}</span>
                    </>
                  ) : (
                    <span className="text-black/50 dark:text-white/50">
                      No winner
                    </span>
                  )}
                </span>
              </div>
            </li>
          ))}
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

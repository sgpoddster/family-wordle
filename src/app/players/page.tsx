import { addPlayer, setPlayerActive } from "@/app/actions";
import AvatarUpload from "@/components/AvatarUpload";
import { getAllPlayers } from "@/lib/data";

export default async function PlayersPage() {
  const players = await getAllPlayers();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Players</h1>

      <form action={addPlayer} className="flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="Family member's name"
          required
          className="flex-1 rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-[#6aaa64] px-4 py-2 font-semibold text-white hover:bg-[#5a9654] transition-colors"
        >
          Add
        </button>
      </form>

      {players.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          No one added yet &mdash; add the first family member above.
        </p>
      ) : (
        <ul className="space-y-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-md border border-black/10 dark:border-white/10 px-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                <AvatarUpload
                  playerId={p.id}
                  name={p.name}
                  avatarUrl={p.avatar_url}
                />
                <span
                  className={p.active ? "" : "text-black/40 dark:text-white/40"}
                >
                  {p.name}
                  {!p.active && " (inactive)"}
                </span>
              </div>
              <form action={setPlayerActive.bind(null, p.id, !p.active)}>
                <button
                  type="submit"
                  className="text-sm underline text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                >
                  {p.active ? "Deactivate" : "Reactivate"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-black/50 dark:text-white/50">
        Click a photo to change it. Deactivating hides someone from the entry
        form and dashboard but keeps their past scores in History.
      </p>
    </div>
  );
}

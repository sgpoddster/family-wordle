import "server-only";
import { supabase } from "@/lib/supabase";
import { MISS_SCORE } from "@/lib/constants";

export { MISS_SCORE };

export type Player = {
  id: string;
  name: string;
  active: boolean;
  avatar_url: string | null;
};

export type Week = {
  id: string;
  start_date: string;
  end_date: string | null;
  winner_player_id: string | null;
  closed_at: string | null;
};

export type Score = {
  id: string;
  player_id: string;
  week_id: string;
  play_date: string;
  guesses: number;
};

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let cur = start;
  while (cur <= end) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }
  return dates;
}

export async function getActivePlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getAllPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getActiveWeek(): Promise<Week> {
  const { data, error } = await supabase
    .from("weeks")
    .select("*")
    .is("end_date", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from("weeks")
    .insert({ start_date: todayStr() })
    .select("*")
    .single();
  if (createError) throw createError;
  return created;
}

export async function getScoresForWeek(weekId: string): Promise<Score[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("week_id", weekId);
  if (error) throw error;
  return data ?? [];
}

export async function getClosedWeeks(): Promise<
  (Week & { winner_name: string | null; winner_avatar_url: string | null })[]
> {
  const { data, error } = await supabase
    .from("weeks")
    .select("*, winner:winner_player_id(name, avatar_url)")
    .not("end_date", "is", null)
    .order("start_date", { ascending: false });
  if (error) throw error;
  type WinnerJoin = { name: string; avatar_url: string | null } | null;
  return (data ?? []).map((w) => {
    const winner = (w as { winner?: WinnerJoin }).winner ?? null;
    return {
      ...w,
      winner_name: winner?.name ?? null,
      winner_avatar_url: winner?.avatar_url ?? null,
    };
  });
}

/** Per-player totals for a week so far: each day from start_date through
 * `through` counts as that day's guesses, or MISS_SCORE if nothing was
 * logged for that player on that day. */
export function computeStandings(
  players: Player[],
  scores: Score[],
  startDate: string,
  through: string
) {
  const days = dateRange(startDate, through);
  const byPlayerDate = new Map<string, number>();
  for (const s of scores) {
    byPlayerDate.set(`${s.player_id}_${s.play_date}`, s.guesses);
  }

  return players
    .map((player) => {
      const daily = days.map((date) => ({
        date,
        guesses: byPlayerDate.get(`${player.id}_${date}`) ?? null,
      }));
      const total = daily.reduce(
        (sum, d) => sum + (d.guesses ?? MISS_SCORE),
        0
      );
      return { player, daily, total };
    })
    .sort((a, b) => a.total - b.total);
}

export { todayStr, addDays, dateRange };

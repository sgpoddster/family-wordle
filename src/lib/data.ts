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
  comeback_player_id: string | null;
  consistent_player_id: string | null;
  margin: number | null;
  closed_at: string | null;
};

export type Standing = {
  player: Player;
  daily: { date: string; guesses: number | null }[];
  total: number;
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

/** Monday–Sunday bounds of the calendar week containing `dateStr`. */
function getWeekBounds(dateStr: string): { monday: string; sunday: string } {
  const dow = new Date(dateStr + "T00:00:00").getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(dateStr, diffToMonday);
  const sunday = addDays(monday, 6);
  return { monday, sunday };
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

type NamedPlayer = { name: string; avatar_url: string | null } | null;

export async function getClosedWeeks(): Promise<
  (Week & {
    winner_name: string | null;
    winner_avatar_url: string | null;
    comeback_name: string | null;
    consistent_name: string | null;
  })[]
> {
  // The comeback/consistent award columns are a newer migration; fall back
  // to winner-only if they haven't been applied to this database yet, so an
  // unrun migration can't take the whole History page down.
  const { data, error } = await supabase
    .from("weeks")
    .select(
      "*, winner:winner_player_id(name, avatar_url), comeback:comeback_player_id(name), consistent:consistent_player_id(name)"
    )
    .not("end_date", "is", null)
    .order("start_date", { ascending: false });

  if (error) {
    const fallback = await supabase
      .from("weeks")
      .select("*, winner:winner_player_id(name, avatar_url)")
      .not("end_date", "is", null)
      .order("start_date", { ascending: false });
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []).map((w) => {
      const row = w as unknown as { winner?: NamedPlayer };
      return {
        ...w,
        winner_name: row.winner?.name ?? null,
        winner_avatar_url: row.winner?.avatar_url ?? null,
        comeback_name: null,
        consistent_name: null,
      };
    });
  }

  return (data ?? []).map((w) => {
    const row = w as unknown as {
      winner?: NamedPlayer;
      comeback?: NamedPlayer;
      consistent?: NamedPlayer;
    };
    return {
      ...w,
      winner_name: row.winner?.name ?? null,
      winner_avatar_url: row.winner?.avatar_url ?? null,
      comeback_name: row.comeback?.name ?? null,
      consistent_name: row.consistent?.name ?? null,
    };
  });
}

/** All scores dated on/after `sinceDate`, across every week -- used for
 * streaks, which need to look back further than the current active week. */
export async function getRecentScores(sinceDate: string): Promise<Score[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .gte("play_date", sinceDate);
  if (error) throw error;
  return data ?? [];
}

function buildStandings(
  players: Player[],
  scores: Score[],
  days: string[],
  today: string,
  penalizeToday: boolean
) {
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
      const total = daily.reduce((sum, d) => {
        if (d.date > today) return sum; // hasn't happened yet, don't penalize
        if (d.date === today && !penalizeToday && d.guesses === null) {
          return sum; // today isn't settled yet -- don't penalize until logged
        }
        return sum + (d.guesses ?? MISS_SCORE);
      }, 0);
      return { player, daily, total };
    })
    .sort((a, b) => a.total - b.total);
}

/** Per-player totals over an explicit date range (used to settle the
 * winner of a manually-tracked week when "End Week" is clicked -- `through`
 * is the day being finalized, so an unlogged entry there does count as a
 * miss since the week is ending now). */
export function computeStandings(
  players: Player[],
  scores: Score[],
  startDate: string,
  through: string
) {
  return buildStandings(
    players,
    scores,
    dateRange(startDate, through),
    through,
    true
  );
}

/** Per-player totals for the calendar week containing `today`: always spans
 * Monday through Sunday (so the chart/leaderboard has a stable shape and
 * rolls over to a fresh week automatically), expanded backward to cover
 * any backfilled score dated before that Monday. Days after `today` show
 * as blank (not yet played) rather than being penalized as a miss, and
 * today itself isn't penalized until it's actually logged -- the day
 * isn't over yet, so an unlogged "today" isn't a miss (yet). */
export function computeWeekStandings(
  players: Player[],
  scores: Score[],
  today: string
) {
  const { monday, sunday } = getWeekBounds(today);
  const earliestScoreDate = scores.reduce(
    (min, s) => (s.play_date < min ? s.play_date : min),
    monday
  );
  return buildStandings(
    players,
    scores,
    dateRange(earliestScoreDate, sunday),
    today,
    false
  );
}

export type Streaks = { played: number; leader: number };

/** Consecutive-days-played and consecutive-days-as-sole/tied-daily-leader
 * streaks, walking backward from today (or yesterday, if today hasn't been
 * logged yet -- the day isn't "missed" until it's actually over). */
export function computeStreaks(
  players: Player[],
  scores: Score[],
  today: string
): Map<string, Streaks> {
  const byDate = new Map<string, Map<string, number>>();
  for (const s of scores) {
    if (!byDate.has(s.play_date)) byDate.set(s.play_date, new Map());
    byDate.get(s.play_date)!.set(s.player_id, s.guesses);
  }

  const result = new Map<string, Streaks>();
  for (const player of players) {
    const playedToday = byDate.get(today)?.has(player.id) ?? false;
    let cursor = playedToday ? today : addDays(today, -1);
    let played = 0;
    let leader = 0;
    let leaderBroken = false;

    for (let i = 0; i < 400; i++) {
      const dayScores = byDate.get(cursor);
      const mine = dayScores?.get(player.id);
      if (mine === undefined) break;
      played++;

      if (!leaderBroken) {
        const min = Math.min(...dayScores!.values());
        if (mine === min) {
          leader++;
        } else {
          leaderBroken = true;
        }
      }
      cursor = addDays(cursor, -1);
    }
    result.set(player.id, { played, leader });
  }
  return result;
}

export type WeekAwards = {
  comebackPlayerId: string | null;
  consistentPlayerId: string | null;
  margin: number | null;
};

/** Superlatives for a just-finished week: biggest rank improvement from the
 * first played day to the final standings ("Comeback of the Week"), lowest
 * variance among players with at least 2 real (non-miss) entries ("Most
 * Consistent"), and the point gap between 1st and 2nd place. */
export function computeWeekAwards(standings: Standing[]): WeekAwards {
  if (standings.length < 2) {
    return { comebackPlayerId: null, consistentPlayerId: null, margin: null };
  }

  const margin = standings[1].total - standings[0].total;

  let consistentPlayerId: string | null = null;
  let bestVariance = Infinity;
  for (const s of standings) {
    const real = s.daily
      .map((d) => d.guesses)
      .filter((g): g is number => g !== null && g < MISS_SCORE);
    if (real.length < 2) continue;
    const mean = real.reduce((a, b) => a + b, 0) / real.length;
    const variance =
      real.reduce((a, b) => a + (b - mean) ** 2, 0) / real.length;
    if (variance < bestVariance) {
      bestVariance = variance;
      consistentPlayerId = s.player.id;
    }
  }

  let comebackPlayerId: string | null = null;
  const days = standings[0].daily.map((d) => d.date);
  const firstPlayedDate = days.find((date) =>
    standings.some((s) => s.daily.find((d) => d.date === date)?.guesses !== null)
  );
  if (firstPlayedDate && days.length > 1) {
    const startOrder = [...standings]
      .map((s) => ({
        id: s.player.id,
        guesses:
          s.daily.find((d) => d.date === firstPlayedDate)?.guesses ??
          MISS_SCORE,
      }))
      .sort((a, b) => a.guesses - b.guesses)
      .map((x) => x.id);
    const finalOrder = standings.map((s) => s.player.id);

    let bestImprovement = 0;
    for (const s of standings) {
      const startRank = startOrder.indexOf(s.player.id);
      const endRank = finalOrder.indexOf(s.player.id);
      const improvement = startRank - endRank;
      if (improvement > bestImprovement) {
        bestImprovement = improvement;
        comebackPlayerId = s.player.id;
      }
    }
  }

  return { comebackPlayerId, consistentPlayerId, margin };
}

export { todayStr, addDays, dateRange, getWeekBounds };

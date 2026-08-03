import "server-only";
import { supabase } from "@/lib/supabase";
import { MISS_SCORE, hasJoinedBy } from "@/lib/constants";

export { MISS_SCORE, hasJoinedBy };

export type Player = {
  id: string;
  name: string;
  active: boolean;
  avatar_url: string | null;
  created_at: string;
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

// Vercel's serverless functions run in UTC regardless of where the family
// actually is, so "today" must be pinned to Singapore time explicitly --
// otherwise the server's day rolls over up to 8 hours behind real SGT.
function todayStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
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
  displayDays: string[],
  totalCutoff: string
) {
  const byPlayerDate = new Map<string, number>();
  for (const s of scores) {
    byPlayerDate.set(`${s.player_id}_${s.play_date}`, s.guesses);
  }

  return players
    .map((player) => {
      const daily = displayDays.map((date) => ({
        date,
        guesses: byPlayerDate.get(`${player.id}_${date}`) ?? null,
      }));
      const settledDays = daily.filter((d) => d.date <= totalCutoff);
      const hasStarted = settledDays.some((d) =>
        isExpectedOn(player, scores, d.date)
      );
      const total = settledDays.reduce((sum, d) => {
        if (d.guesses !== null) return sum + d.guesses; // a real entry always counts
        if (!isExpectedOn(player, scores, d.date)) return sum; // wasn't around yet
        return sum + MISS_SCORE;
      }, 0);
      return { player, daily, total, hasStarted };
    })
    .sort((a, b) => {
      // Someone with zero applicable days yet (just joined) hasn't proven
      // anything -- don't let a trivial 0 total rank them above people who
      // have actually been playing.
      if (a.hasStarted !== b.hasStarted) return a.hasStarted ? -1 : 1;
      return a.total - b.total;
    });
}

/** Whether `player` should be considered part of the group on `date`: either
 * their profile existed by then, or -- since re-creating a player's row
 * (e.g. after a data cleanup) doesn't erase the fact they were already
 * playing -- they have a real logged entry on or before that date. This
 * keeps backfilled history intact while still not penalizing someone
 * added mid-week for days before they actually joined. */
function isExpectedOn(player: Player, scores: Score[], date: string): boolean {
  if (hasJoinedBy(player, date)) return true;
  return scores.some((s) => s.player_id === player.id && s.play_date <= date);
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
  return buildStandings(players, scores, dateRange(startDate, through), through);
}

/** The most recent day (walking backward through `days`) on which every
 * player expected to be around by then (see isExpectedOn) has some entry
 * (a score or an explicit fail). Days after this are still "in progress"
 * -- not everyone has weighed in yet, so nothing should be settled
 * through them. Returns the day before `days[0]` if no day qualifies yet. */
export function getLastCompleteDay(
  players: Player[],
  scores: Score[],
  days: string[]
): string {
  const logged = new Set(scores.map((s) => `${s.player_id}_${s.play_date}`));
  for (let i = days.length - 1; i >= 0; i--) {
    const date = days[i];
    const expected = players.filter((p) => isExpectedOn(p, scores, date));
    if (
      expected.length > 0 &&
      expected.every((p) => logged.has(`${p.id}_${date}`))
    ) {
      return date;
    }
  }
  return addDays(days[0], -1);
}

/** Live standings for the calendar week containing `today`: always a hard
 * Monday-Sunday boundary, with zero carryover from the prior week -- even
 * if a score happens to be tagged with this week's week_id (e.g. logged a
 * day late, after the new week already rolled over), a play_date that
 * falls outside [monday, sunday] is excluded entirely. The leaderboard
 * total only settles through the last day everyone has actually weighed
 * in on -- an in-progress day where some people haven't logged yet doesn't
 * count against anyone until it's complete. */
export function computeWeekStandings(
  players: Player[],
  scores: Score[],
  today: string
): { standings: ReturnType<typeof buildStandings>; completeThrough: string } {
  const { monday, sunday } = getWeekBounds(today);
  const weekScores = scores.filter(
    (s) => s.play_date >= monday && s.play_date <= sunday
  );
  const displayDays = dateRange(monday, sunday);
  const completeThrough = getLastCompleteDay(
    players,
    weekScores,
    displayDays.filter((d) => d <= today)
  );
  return {
    standings: buildStandings(players, weekScores, displayDays, completeThrough),
    completeThrough,
  };
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

/** Every score ever logged, across all weeks -- used for all-time records
 * (Hall of Fame) and the calendar heatmap, which need the full history. */
export async function getAllScores(): Promise<Score[]> {
  const { data, error } = await supabase.from("scores").select("*");
  if (error) throw error;
  return data ?? [];
}

/** The single best (lowest, non-miss) score ever logged, or null if no one
 * has a real score yet. Ties go to whichever happened first. */
export function getBestDayEver(scores: Score[]): Score | null {
  let best: Score | null = null;
  for (const s of scores) {
    if (s.guesses >= MISS_SCORE) continue;
    if (
      !best ||
      s.guesses < best.guesses ||
      (s.guesses === best.guesses && s.play_date < best.play_date)
    ) {
      best = s;
    }
  }
  return best;
}

/** The longest-ever run of consecutive calendar days a player has logged
 * something (score or fail), anywhere in their history -- not just the
 * streak currently running. */
export function longestStreakEver(scores: Score[], playerId: string): number {
  const dates = [...new Set(
    scores.filter((s) => s.player_id === playerId).map((s) => s.play_date)
  )].sort();

  let longest = 0;
  let current = 0;
  let prevDate: string | null = null;
  for (const date of dates) {
    current = prevDate && addDays(prevDate, 1) === date ? current + 1 : 1;
    longest = Math.max(longest, current);
    prevDate = date;
  }
  return longest;
}

export { todayStr, addDays, dateRange, getWeekBounds };

"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import {
  MISS_SCORE,
  addDays,
  computeStandings,
  computeWeekAwards,
  getActivePlayers,
  getActiveWeek,
  getAllScores,
  getWeekBounds,
  getWeekById,
  todayStr,
} from "@/lib/data";

export type SubmitScoreResult = {
  guesses: number;
};

export async function submitScore(
  formData: FormData
): Promise<SubmitScoreResult> {
  const playerId = String(formData.get("playerId") ?? "");
  const playDate = String(formData.get("playDate") ?? todayStr());
  const guessesRaw = String(formData.get("guesses") ?? "");

  if (!playerId || !guessesRaw) {
    throw new Error("Missing player or score");
  }

  const guesses = guessesRaw === "fail" ? MISS_SCORE : Number(guessesRaw);
  if (!Number.isInteger(guesses) || guesses < 1 || guesses > MISS_SCORE) {
    throw new Error("Invalid score");
  }

  const week = await getActiveWeek();

  const { error } = await supabase.from("scores").upsert(
    {
      player_id: playerId,
      week_id: week.id,
      play_date: playDate,
      guesses,
    },
    { onConflict: "player_id,play_date" }
  );
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/dashboard");

  return { guesses };
}

export async function addPlayer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  const { data: player, error } = await supabase
    .from("players")
    .insert({ name })
    .select("id")
    .single();
  if (error) throw error;

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    await uploadAvatarFile(player.id, photo);
  }

  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath("/dashboard");
}

async function uploadAvatarFile(playerId: string, photo: File) {
  const ext = photo.name.split(".").pop() || "jpg";
  const path = `${playerId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await photo.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, { contentType: photo.type, upsert: true });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("players")
    .update({ avatar_url: publicUrl })
    .eq("id", playerId);
  if (updateError) throw updateError;
}

export async function updateAvatar(formData: FormData) {
  const playerId = String(formData.get("playerId") ?? "");
  const photo = formData.get("photo");
  if (!playerId || !(photo instanceof File) || photo.size === 0) return;

  await uploadAvatarFile(playerId, photo);

  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath("/dashboard");
}

export async function setPlayerActive(playerId: string, active: boolean) {
  const { error } = await supabase
    .from("players")
    .update({ active })
    .eq("id", playerId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath("/dashboard");
}

/**
 * End (or re-finalize) a week. With no weekId, targets whichever week is
 * currently open -- the normal "End Week" flow: closes it and creates the
 * next one starting the following Monday.
 *
 * With an explicit weekId pointing at an ALREADY-closed week (e.g. new
 * scores were added for a past week after it was first ended), this
 * recomputes and updates its winner/awards in place -- end_date doesn't
 * move and no new week gets created, so re-finalizing never produces a
 * duplicate/phantom week row.
 */
export async function endWeek(weekId?: string) {
  const week = weekId ? await getWeekById(weekId) : await getActiveWeek();
  const players = await getActivePlayers();
  const today = todayStr();
  const wasOpen = !week.end_date;

  // Weeks are always calendar Monday-Sunday -- finalize through that week's
  // own Sunday (or today, if ending it early mid-week; or its existing
  // end_date, if it was already closed), never past it. If this week went
  // unclosed for a while, `today` could already be deep into a later
  // calendar week; without this bound the tally would wrongly pull in any
  // days beyond the week actually being closed.
  const { sunday } = getWeekBounds(week.start_date);
  const through = week.end_date ?? (today < sunday ? today : sunday);

  // Bound by play_date, not week_id: a score is tagged with whichever week
  // was open at submission time, which can lag behind its actual date if
  // "End Week" wasn't clicked promptly -- this week's real scores can end
  // up filed under an earlier week's id.
  const allScores = await getAllScores();
  const scores = allScores.filter(
    (s) => s.play_date >= week.start_date && s.play_date <= through
  );

  const standings = computeStandings(players, scores, week.start_date, through);
  const winnerId = standings[0]?.player.id ?? null;
  const awards = computeWeekAwards(standings);

  const { error: closeError } = await supabase
    .from("weeks")
    .update({
      end_date: through,
      winner_player_id: winnerId,
      comeback_player_id: awards.comebackPlayerId,
      consistent_player_id: awards.consistentPlayerId,
      margin: awards.margin,
      closed_at: new Date().toISOString(),
    })
    .eq("id", week.id);
  if (closeError) throw closeError;

  if (wasOpen) {
    // Next week always starts the Monday right after this one -- keeps the
    // weeks table calendar-aligned even if this one was closed out late.
    const { error: createError } = await supabase.from("weeks").insert({
      start_date: addDays(sunday, 1),
    });
    if (createError) throw createError;
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export type PlayerStats = {
  gamesPlayed: number;
  bestScore: number | null;
  average: number | null;
  playedStreak: number;
  weeksWon: number;
  comebackAwards: number;
  consistentAwards: number;
};

async function countWeeksWhere(column: string, playerId: string): Promise<number> {
  const { count, error } = await supabase
    .from("weeks")
    .select("id", { count: "exact", head: true })
    .eq(column, playerId);
  if (error) return 0; // column may not exist yet on older schemas
  return count ?? 0;
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const { data, error } = await supabase
    .from("scores")
    .select("guesses, play_date")
    .eq("player_id", playerId);
  if (error) throw error;

  const rows = data ?? [];
  const real = rows.map((r) => r.guesses).filter((g) => g < MISS_SCORE);
  const gamesPlayed = rows.length;
  const bestScore = real.length ? Math.min(...real) : null;
  const average = real.length
    ? Math.round((real.reduce((a, b) => a + b, 0) / real.length) * 10) / 10
    : null;

  const datesPlayed = new Set(rows.map((r) => r.play_date));
  const today = todayStr();
  let cursor = datesPlayed.has(today) ? today : addDays(today, -1);
  let playedStreak = 0;
  for (let i = 0; i < 400; i++) {
    if (!datesPlayed.has(cursor)) break;
    playedStreak++;
    cursor = addDays(cursor, -1);
  }

  const [weeksWon, comebackAwards, consistentAwards] = await Promise.all([
    countWeeksWhere("winner_player_id", playerId),
    countWeeksWhere("comeback_player_id", playerId),
    countWeeksWhere("consistent_player_id", playerId),
  ]);

  return {
    gamesPlayed,
    bestScore,
    average,
    playedStreak,
    weeksWon,
    comebackAwards,
    consistentAwards,
  };
}

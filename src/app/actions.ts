"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import {
  MISS_SCORE,
  addDays,
  computeStandings,
  computeWeekAwards,
  computeWeekStandings,
  getActivePlayers,
  getActiveWeek,
  getScoresForWeek,
  todayStr,
} from "@/lib/data";

export type SubmitScoreResult = {
  guesses: number;
  leaderChanged: boolean;
  newLeaderName: string | null;
  closeRace: boolean;
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
  const today = todayStr();
  const players = await getActivePlayers();
  const before = computeWeekStandings(players, await getScoresForWeek(week.id), today);

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

  const after = computeWeekStandings(players, await getScoresForWeek(week.id), today);
  const beforeLeaderId = before[0]?.player.id ?? null;
  const afterLeaderId = after[0]?.player.id ?? null;
  const leaderChanged =
    afterLeaderId === playerId && beforeLeaderId !== afterLeaderId;
  const margin = after.length >= 2 ? after[1].total - after[0].total : null;

  return {
    guesses,
    leaderChanged,
    newLeaderName: leaderChanged
      ? players.find((p) => p.id === afterLeaderId)?.name ?? null
      : null,
    closeRace: margin !== null && margin <= 1,
  };
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

export async function endWeek() {
  const week = await getActiveWeek();
  const players = await getActivePlayers();
  const scores = await getScoresForWeek(week.id);
  const today = todayStr();

  const standings = computeStandings(players, scores, week.start_date, today);
  const winnerId = standings[0]?.player.id ?? null;
  const awards = computeWeekAwards(standings);

  const { error: closeError } = await supabase
    .from("weeks")
    .update({
      end_date: today,
      winner_player_id: winnerId,
      comeback_player_id: awards.comebackPlayerId,
      consistent_player_id: awards.consistentPlayerId,
      margin: awards.margin,
      closed_at: new Date().toISOString(),
    })
    .eq("id", week.id);
  if (closeError) throw closeError;

  const { error: createError } = await supabase.from("weeks").insert({
    start_date: addDays(today, 1),
  });
  if (createError) throw createError;

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

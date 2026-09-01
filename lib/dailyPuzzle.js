// Daily puzzle results, now backed by Supabase instead of localStorage.
// This means "already played today" correctly follows a person across
// devices, and everyone's times are visible for a real leaderboard.

import { createClient } from "@/lib/supabase/client";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Returns this person's elapsed time for today's puzzle in this deck, or
// null if they haven't played yet.
export async function getTodayResult(deckId, email) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("daily_results")
    .select("elapsed_seconds")
    .eq("deck_id", deckId)
    .eq("email", email)
    .eq("play_date", todayStr())
    .maybeSingle();
  if (error) throw error;
  return data ? data.elapsed_seconds : null;
}

export async function recordTodayResult(deckId, email, name, elapsedSeconds) {
  const supabase = createClient();
  const { error } = await supabase
    .from("daily_results")
    .insert({ deck_id: deckId, email, name, elapsed_seconds: elapsedSeconds });
  if (error) throw error;
}

// Today's leaderboard for this deck, fastest first.
export async function getDailyLeaderboard(deckId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("daily_results")
    .select("name, email, elapsed_seconds")
    .eq("deck_id", deckId)
    .eq("play_date", todayStr())
    .order("elapsed_seconds", { ascending: true });
  if (error) throw error;
  return data || [];
}

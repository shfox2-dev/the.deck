import { createClient } from "@/lib/supabase/client";

// Ladder for this deck, top rank first. Only people who've played at least
// one duel appear here at all.
export async function getDuelLadder(deckId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("duel_ladder")
    .select("email, name, rank")
    .eq("deck_id", deckId)
    .order("rank", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function recordDuelResult(deckId, winner, loser) {
  const supabase = createClient();
  const { error } = await supabase.rpc("record_duel_result", {
    p_deck_id: deckId,
    p_winner_email: winner.email,
    p_winner_name: winner.name,
    p_loser_email: loser.email,
    p_loser_name: loser.name,
  });
  if (error) throw error;
}

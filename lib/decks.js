// Deck storage, now backed by Supabase instead of localStorage -- this is
// what makes decks actually shared: every logged-in person reads the same
// data, and only admins can write, enforced by the RLS policies in
// supabase/decks_seed.sql (not just by hiding buttons in the UI).
//
// Every function here is now async, since it's a real network request
// instead of an instant localStorage read. Callers need to await these and
// handle a loading state -- see any page that imports from this file for
// the pattern (useState + useEffect).

import { createClient } from "@/lib/supabase/client";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Normalizes Supabase's snake_case columns (debut_date, group_id) into the
// camelCase shape the rest of the app already expects (debutDate, groupId),
// so components didn't need to change when this file switched to Supabase.
function normalizeDeck(row) {
  return {
    id: row.id,
    name: row.name,
    groups: (row.groups || []).map((g) => ({ id: g.id, name: g.name })),
    cards: (row.cards || []).map((c) => ({
      id: c.id,
      word: c.word,
      definition: c.definition,
      debutDate: c.debut_date,
      groupId: c.group_id,
    })),
  };
}

export async function getDecks() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("decks")
    .select("id, name, groups(id, name), cards(id, word, definition, debut_date, group_id)")
    .order("name");
  if (error) throw error;
  return (data || []).map(normalizeDeck);
}

export async function getDeck(deckId) {
  if (!deckId) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("decks")
    .select("id, name, groups(id, name), cards(id, word, definition, debut_date, group_id)")
    .eq("id", deckId)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeDeck(data) : null;
}

export async function addDeck(name) {
  const supabase = createClient();
  const id = name.toLowerCase().trim().replace(/\s+/g, "-") + "-" + Date.now().toString(36);
  const { error } = await supabase.from("decks").insert({ id, name });
  if (error) throw error;
  return { id, name, groups: [], cards: [] };
}

export async function addGroup(deckId, name) {
  const supabase = createClient();
  const id = "grp-" + Date.now().toString(36);
  const { error } = await supabase.from("groups").insert({ id, deck_id: deckId, name });
  if (error) throw error;
  return getDeck(deckId);
}

export async function addCard(deckId, { word, definition, debutDate, groupId }) {
  const supabase = createClient();
  const id = "c-" + Date.now().toString(36);
  const { error } = await supabase.from("cards").insert({
    id,
    deck_id: deckId,
    group_id: groupId || null,
    word,
    definition,
    debut_date: debutDate || null,
  });
  if (error) throw error;
  return getDeck(deckId);
}

export async function setCardGroup(deckId, cardId, groupId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("cards")
    .update({ group_id: groupId || null })
    .eq("id", cardId)
    .eq("deck_id", deckId);
  if (error) throw error;
  return getDeck(deckId);
}

export async function deleteCard(deckId, cardId) {
  const supabase = createClient();
  const { error } = await supabase.from("cards").delete().eq("id", cardId).eq("deck_id", deckId);
  if (error) throw error;
}

export function isDebutToday(card) {
  return !!card.debutDate && card.debutDate === todayStr();
}

// Picks up to 4 cards from a specific group (or the whole deck if no group
// given) -- used by Duel's challenge flow. The challenger picks the
// category, so this needs an explicit groupId rather than a random one.
export function pickRoundCardIds(deck, groupId) {
  const pool = groupId ? deck.cards.filter((c) => c.groupId === groupId) : deck.cards;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(4, shuffled.length)).map((c) => c.id);
}

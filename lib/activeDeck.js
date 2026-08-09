// Students always play their roster-assigned deck -- no ambiguity there.
// Admins manage multiple decks, so once they pick one from "Choose Your
// Deck," we remember it for the rest of the tab session (sessionStorage,
// not localStorage -- clears when the tab closes, so it doesn't leak into
// a future session on a shared computer).

const KEY = "activeDeckId";

export function getActiveDeckId() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}

export function setActiveDeckId(deckId) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, deckId);
}

// The deck id to actually use for a given logged-in person: students always
// use their roster's deck_id; admins use whatever they last picked (or null
// if they haven't picked one yet this session).
export function effectiveDeckId(roster) {
  if (roster.role === "admin") return getActiveDeckId();
  return roster.deck_id;
}

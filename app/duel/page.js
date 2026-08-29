"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDeck, pickRoundCardIds } from "@/lib/decks";
import { effectiveDeckId } from "@/lib/activeDeck";
import { useActiveUsers, presenceLabel } from "@/lib/presence";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";
import { useDuel } from "@/components/DuelProvider";

export default function Duel() {
  return (
    <AuthGate>
      <DuelContent />
    </AuthGate>
  );
}

function DuelContent() {
  const { roster } = useAuth();
  const { sendChallenge, outgoing } = useDuel();
  const [deckId] = useState(() => effectiveDeckId(roster));
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deckId) {
      setLoading(false);
      return;
    }
    let active = true;
    getDeck(deckId).then((d) => {
      if (active) {
        setDeck(d);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [deckId]);

  // Presence must still be called every render regardless of loading state,
  // per the Rules of Hooks -- deckId may be null briefly, the hook itself
  // guards against that internally.
  const users = useActiveUsers(deckId, roster);
  const others = users.filter((u) => u.email !== roster.email);

  if (loading) {
    return (
      <main className="min-h-screen bg-green-dark flex items-center justify-center">
        <Header />
      </main>
    );
  }

  if (!deck) {
    return (
      <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Header />
        <p className="text-off-white text-sm max-w-xs">
          Pick a deck first from "Choose Your Deck" on the home page.
        </p>
        <Link href="/" className="text-sm underline text-off-white">Go there now</Link>
      </main>
    );
  }

  function challenge(user) {
    if (outgoing) return; // already waiting on someone else
    const cardIds = pickRoundCardIds(deck);
    sendChallenge(user, deckId, cardIds);
  }

  return (
    <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-8 px-6 py-16">
      <Header />
      <div className="text-center">
        <p className="text-sm text-off-white">{deck.name}</p>
        <h1 className="text-2xl font-medium mt-1 text-off-white">Who's active</h1>
      </div>

      {others.length === 0 ? (
        <p className="text-off-white text-sm max-w-xs text-center">
          Nobody else is active in this deck right now. Once a classmate opens the app, they'll show up here.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 max-w-xl">
          {others.map((u) => (
            <button
              key={u.email}
              onClick={() => challenge(u)}
              disabled={!!outgoing}
              className="rounded-lg bg-off-white text-blue text-sm px-3 py-4 text-center disabled:opacity-50"
            >
              {presenceLabel(u)} is active
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

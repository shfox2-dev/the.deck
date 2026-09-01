"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getDeck } from "@/lib/decks";
import { logPracticeToday, computeStreak, getPracticeLog } from "@/lib/streak";
import { effectiveDeckId } from "@/lib/activeDeck";
import { fitTextSizeClass } from "@/lib/textFit";
import Header from "@/components/Header";
import FlashCard from "@/components/FlashCard";
import MatchingBoard from "@/components/MatchingBoard";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";

export default function Practice() {
  return (
    <AuthGate>
      <PracticeContent />
    </AuthGate>
  );
}

function PracticeContent() {
  // AuthGate guarantees roster is non-null by the time this renders.
  const { roster } = useAuth();
  const [deckId] = useState(() => effectiveDeckId(roster));
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null | "matching" | "expert"

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

  if (loading) {
    return (
      <main className="min-h-dvh bg-green-dark flex items-center justify-center">
        <Header />
      </main>
    );
  }

  if (!deck) {
    return (
      <main className="min-h-dvh bg-green-dark flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Header />
        <p className="text-off-white text-sm max-w-xs">
          Pick a deck first from "Choose Your Deck" on the home page.
        </p>
        <Link href="/" className="text-sm underline text-off-white">Go there now</Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-green-dark flex flex-col items-center justify-center gap-8 px-4 py-12 overflow-hidden">
      <Header />

      {mode === null && (
        <>
          <div className="text-center">
            <p className="text-sm text-off-white">{deck.name}</p>
            <h1 className="text-2xl font-medium mt-1 text-off-white">Choose a mode</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setMode("matching")}
              className="px-5 py-3 rounded-lg bg-off-white text-blue text-sm font-medium"
            >
              Matching mode
            </button>
            <button
              onClick={() => setMode("expert")}
              className="px-5 py-3 rounded-lg bg-off-white text-blue text-sm font-medium"
            >
              Expert mode
            </button>
          </div>
        </>
      )}

      {mode === "matching" && <MatchingMode deck={deck} onExit={() => setMode(null)} />}
      {mode === "expert" && <ExpertMode deck={deck} onExit={() => setMode(null)} />}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Matching mode ("Mastery"): 4 cards at a time from the same group, scattered
// randomly (no overlap) as term tiles and definition tiles. The actual
// drag/pair/grade mechanic now lives in the shared <MatchingBoard>, used by
// both this and the live duel match -- see components/MatchingBoard.js.
// ---------------------------------------------------------------------------
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickRoundCards(deck, groupId) {
  const pool = deck.cards.filter((c) => c.groupId === groupId);
  return shuffle(pool).slice(0, Math.min(4, pool.length));
}

function MatchingMode({ deck, onExit }) {
  const eligibleGroups = (deck.groups || []).filter(
    (g) => deck.cards.filter((c) => c.groupId === g.id).length >= 2
  );
  const [groupId, setGroupId] = useState(null);
  const [round, setRound] = useState([]);
  const [won, setWon] = useState(false);

  function startCategory(gid) {
    setGroupId(gid);
    setRound(pickRoundCards(deck, gid));
    setWon(false);
  }

  function newRound() {
    setRound(pickRoundCards(deck, groupId));
    setWon(false);
  }

  function handleResult(allCorrect) {
    if (allCorrect) {
      logPracticeToday();
      setWon(true);
    }
  }

  if (!groupId) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-off-white text-sm">Choose a category</p>
        {eligibleGroups.length === 0 ? (
          <p className="text-off-white text-sm max-w-xs">
            No category has enough cards yet. Add a few more cards to a group in Manage decks.
          </p>
        ) : (
          <div className="flex gap-3 flex-wrap justify-center">
            {eligibleGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => startCategory(g.id)}
                className="px-4 py-2 rounded-lg bg-off-white text-blue text-sm"
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
        <button onClick={onExit} className="text-sm underline text-off-white">Change mode</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-off-white">Drag any two tiles together to pair them</p>

      <MatchingBoard cards={round} onResult={handleResult} disabled={won} />

      {won && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-off-white text-sm">All matched correctly!</p>
          <button onClick={newRound} className="px-4 py-2 rounded-lg bg-off-white text-blue text-sm">
            New round
          </button>
        </div>
      )}

      <button onClick={() => setGroupId(null)} className="text-sm underline text-off-white">
        Change category
      </button>
      <button onClick={onExit} className="text-sm underline text-off-white">Change mode</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expert mode: same interaction as the daily puzzle (type the word from the
// definition), but works through the entire deck instead of one card a day.
// Streak display removed for now per request -- streak is still logged.
// ---------------------------------------------------------------------------
function ExpertMode({ deck, onExit }) {
  const [order] = useState(() => shuffle(deck.cards));
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [wrong, setWrong] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  const card = order[index];

  function submit(e) {
    e.preventDefault();
    const correct = guess.trim().toLowerCase() === card.word.toLowerCase();
    if (!correct) {
      setWrong(true);
      return;
    }
    setWrong(false);
    setGuess("");
    if (index + 1 >= order.length) {
      logPracticeToday();
      setDone(true);
    } else {
      setIndex(index + 1);
    }
  }

  if (done) {
    const totalSecs = ((Date.now() - startedAt) / 1000).toFixed(1);
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-off-white">Deck complete</p>
        <h2 className="text-2xl font-medium text-off-white">{totalSecs}s total</h2>
        <button onClick={onExit} className="text-sm underline text-off-white mt-2">Change mode</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-off-white">Card {index + 1} of {order.length}</p>

      <FlashCard size="md">
        <p className={fitTextSizeClass(card.definition)}>{card.definition}</p>
      </FlashCard>

      <form onSubmit={submit} className="flex flex-col items-center gap-3 w-72">
        <input
          ref={inputRef}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Your answer"
          className="w-full border border-blue bg-off-white rounded-lg px-3 py-2 text-center text-blue"
        />
        <button type="submit" className="px-5 py-2 rounded-lg bg-green-light text-green-dark text-sm">
          Submit
        </button>
        {wrong && <p className="text-sm text-red">Not quite — try again</p>}
      </form>

      <button onClick={onExit} className="text-sm underline text-off-white">Change mode</button>
    </div>
  );
}

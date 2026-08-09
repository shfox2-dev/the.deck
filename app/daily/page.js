"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getDeck, isDebutToday } from "@/lib/decks";
import { MOCK_LEADERBOARD } from "@/lib/mockLeaderboard";
import { getTodayResult, recordTodayResult } from "@/lib/dailyPuzzle";
import { effectiveDeckId } from "@/lib/activeDeck";
import Header from "@/components/Header";
import FlashCard from "@/components/FlashCard";
import Leaderboard from "@/components/Leaderboard";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";

// Same card for every student in the group: pick deterministically by day.
function dailyCard(cards) {
  const dayNum = Math.floor(Date.now() / 86400000);
  return cards[dayNum % cards.length];
}

export default function Daily() {
  return (
    <AuthGate>
      <DailyContent />
    </AuthGate>
  );
}

function DailyContent() {
  // AuthGate guarantees roster is non-null by the time this renders.
  const { roster } = useAuth();
  const [deckId] = useState(() => effectiveDeckId(roster));
  const deck = deckId ? getDeck(deckId) : null;

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

  return <DailyGame cards={deck.cards} />;
}

function DailyGame({ cards }) {
  const [card] = useState(() => dailyCard(cards));
  const [guess, setGuess] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState(null); // null | "correct" | "wrong"
  const [elapsed, setElapsed] = useState(0);
  // undefined = haven't checked localStorage yet, null = checked and NOT
  // played today, a number = checked and already played with this score.
  // Using undefined vs null (instead of null for both "unchecked" and "not
  // played") was the actual bug -- both cases looked identical before, so
  // the page got stuck on the loading branch forever for anyone who hadn't
  // played yet, which is why it "returned nothing."
  const [alreadyPlayed, setAlreadyPlayed] = useState(undefined);
  const inputRef = useRef(null);

  useEffect(() => {
    const existing = getTodayResult(); // a number, or null if not played
    setAlreadyPlayed(existing);
    if (existing == null) inputRef.current?.focus();
  }, []);

  function submit(e) {
    e.preventDefault();
    if (result === "correct") return;
    const correct = guess.trim().toLowerCase() === card.word.toLowerCase();
    if (correct) {
      const secs = Number(((Date.now() - startedAt) / 1000).toFixed(1));
      setElapsed(secs);
      setResult("correct");
      recordTodayResult(secs);
    } else {
      setResult("wrong");
    }
  }

  const isDebut = isDebutToday(card);

  // Still checking localStorage on mount -- avoid a flash of the puzzle.
  if (alreadyPlayed === undefined) {
    return (
      <main className="min-h-screen bg-green-dark flex items-center justify-center">
        <Header />
      </main>
    );
  }

  const finalTime = alreadyPlayed != null ? alreadyPlayed : elapsed;
  const showLeaderboard = result === "correct" || alreadyPlayed != null;

  if (showLeaderboard) {
    const board = [...MOCK_LEADERBOARD.dailySpeed, { name: "You", value: finalTime }]
      .sort((a, b) => a.value - b.value)
      .map((r) => ({ name: r.name, display: `${r.value}s`, isYou: r.name === "You" }));

    return (
      <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-6 px-6 text-center">
        <Header />
        <p className="text-sm text-off-white">
          {alreadyPlayed != null && result !== "correct" ? "Already solved today in" : "Solved in"}
        </p>
        <h1 className="text-3xl font-medium text-off-white">{finalTime}s</h1>
        <Leaderboard title="Today's speed board" rows={board} />
        <Link href="/" className="text-sm underline text-off-white mt-4">Back to the deck</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-6 px-6 text-center">
      <Header />

      {isDebut && (
        <p className="text-xs font-medium text-gold-dark bg-gold-med px-3 py-1 rounded-full">
          New card debut
        </p>
      )}
      <p className="text-sm text-off-white">Today's puzzle · type the word</p>

      <FlashCard gold={isDebut} size="md">
        <p className="text-xl">{card.definition}</p>
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
        {result === "wrong" && (
          <p className="text-sm text-red">Not quite — try again</p>
        )}
      </form>
    </main>
  );
}

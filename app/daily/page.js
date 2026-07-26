"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getDecks, isDebutToday } from "@/lib/decks";
import { MOCK_LEADERBOARD } from "@/lib/mockLeaderboard";
import { getTodayResult, recordTodayResult } from "@/lib/dailyPuzzle";
import BurgerMenu from "@/components/BurgerMenu";
import FlashCard from "@/components/FlashCard";
import Leaderboard from "@/components/Leaderboard";

// Same card for every student in the group: pick deterministically by day.
function dailyCard(cards) {
  const dayNum = Math.floor(Date.now() / 86400000);
  return cards[dayNum % cards.length];
}

export default function Daily() {
  // TODO: once accounts/rosters exist, use the student's actual assigned
  // group instead of always the first deck.
  const [cards] = useState(() => getDecks()[0].cards);
  const [card] = useState(() => dailyCard(cards));
  const [guess, setGuess] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState(null); // null | "correct" | "wrong"
  const [elapsed, setElapsed] = useState(0);
  const [alreadyPlayed, setAlreadyPlayed] = useState(null); // null = still checking
  const inputRef = useRef(null);

  useEffect(() => {
    const existing = getTodayResult();
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
  if (alreadyPlayed === null) {
    return (
      <main className="min-h-screen bg-green-dark flex items-center justify-center">
        <BurgerMenu />
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
        <BurgerMenu />
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
      <BurgerMenu />

      {isDebut && (
        <p className="text-xs font-medium text-gold-dark bg-gold-med px-3 py-1 rounded-full">
          New card debut
        </p>
      )}
      <p className="text-sm text-off-white">Today's puzzle · type the word</p>

      <FlashCard gold={isDebut} size="md">
        <p className="text-sm">{card.definition}</p>
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

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getDecks, isDebutToday } from "@/lib/decks";
import { MOCK_LEADERBOARD } from "@/lib/mockLeaderboard";

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
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit(e) {
    e.preventDefault();
    if (result === "correct") return;
    const correct = guess.trim().toLowerCase() === card.word.toLowerCase();
    if (correct) {
      setElapsed(((Date.now() - startedAt) / 1000).toFixed(1));
      setResult("correct");
    } else {
      setResult("wrong");
    }
  }

  const isDebut = isDebutToday(card);

  if (result === "correct") {
    const board = [...MOCK_LEADERBOARD.dailySpeed, { name: "You", value: Number(elapsed) }]
      .sort((a, b) => a.value - b.value);

    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm text-muted">Solved in</p>
        <h1 className="text-3xl font-medium text-ink">{elapsed}s</h1>
        <div className="w-full max-w-xs text-left">
          <p className="text-xs text-muted mb-2">Today's speed board</p>
          <ol className="text-sm space-y-1">
            {board.map((r, i) => (
              <li
                key={r.name}
                className={`flex justify-between ${r.name === "You" ? "font-medium" : ""} ${
                  i === 0 ? "text-gold-ink font-medium" : "text-ink"
                }`}
              >
                <span>{i + 1}. {r.name}</span>
                <span>{r.value}s</span>
              </li>
            ))}
          </ol>
        </div>
        <Link href="/" className="text-sm underline text-muted mt-4">Back to deck</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6 text-center">
      {isDebut && (
        <p className="text-xs font-medium text-gold-ink bg-gold/30 px-3 py-1 rounded-full">
          New word debut
        </p>
      )}
      <p className="text-sm text-muted">Today's puzzle · type the word</p>

      <div
        className={`w-72 rounded-2xl border px-6 py-8 text-center
          ${isDebut ? "border-gold-dark bg-gold/20" : "border-border bg-surface"}`}
      >
        <p className="text-base text-ink">{card.definition}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col items-center gap-3 w-72">
        <input
          ref={inputRef}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Your answer"
          className="w-full border border-border bg-surface rounded-lg px-3 py-2 text-center text-ink"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm"
        >
          Submit
        </button>
        {result === "wrong" && (
          <p className="text-sm text-brand-red">Not quite — try again</p>
        )}
      </form>
    </main>
  );
}

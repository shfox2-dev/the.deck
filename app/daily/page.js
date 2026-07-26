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
      <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-6 px-6 text-center">
      <button
        aria-label="Open menu"
        onClick={() => setMenuOpen(true)}
        className="absolute top-6 left-6 w-10 h-10 rounded-lg border border-green-light bg-green-light
                   flex flex-col items-center justify-center gap-1"
      >
        <span className="block w-5 h-0.5 bg-green-dark" />
        <span className="block w-5 h-0.5 bg-green-dark" />
        <span className="block w-5 h-0.5 bg-green-dark" />
      </button>

      {menuOpen && (
        <div className="fixed inset-0 z-[1000] flex">
          <div
            className="fixed inset-0 bg-green-light/0"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="relative w-44 h-full bg-green-light border-r border-green-light p-6 flex flex-col gap-4">
            <button
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="self-end text-green-dark text-sm"
            >
              Close
            </button>
            <Link href="/" className="text-green-dark text-sm font-medium" onClick={() => setMenuOpen(false)}>
              The Deck
            </Link>
            <Link href="/admin" className="text-green-dark text-sm font-medium" onClick={() => setMenuOpen(false)}>
              Manage decks
            </Link>
          </nav>
        </div>
      )}
        <p className="text-sm text-green-light">Solved in</p>
        <h1 className="text-3xl font-medium text-green-light">{elapsed}s</h1>
        <div className="w-full max-w-xs text-left">
          <p className="text-xs text-green-light mb-2">Today's speed board</p>
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6 text-center">
      {isDebut && (
        <p className="text-xs font-medium text-gold-ink bg-gold/30 px-3 py-1 rounded-full">
          New Card
        </p>
      )}
      <p className="text-sm text-green-light">Today's puzzle · type the word</p>

      <div
        className={`w-72 rounded-2xl border px-6 py-8 text-center
          ${isDebut ? "border-gold-light bg-gold-med" : "border-blue bg-off-white"}`}
      >
        <p className="text-gold-dark text-blue">{card.definition}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col items-center gap-3 w-72">
        <input
          ref={inputRef}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Your answer"
          className="w-full border border-blue bg-off-white rounded-lg px-3 py-2 text-center text-blue"
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

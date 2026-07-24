"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DECK, MOCK_LEADERBOARD } from "@/lib/mockData";

// Same card for every student in the group: pick deterministically by day.
function dailyCard() {
  const dayNum = Math.floor(Date.now() / 86400000);
  return DECK[dayNum % DECK.length];
}

export default function Daily() {
  const [card] = useState(dailyCard);
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

  const isDebut = card.isNew;

  if (result === "correct") {
    const board = [...MOCK_LEADERBOARD.dailySpeed, { name: "You", value: Number(elapsed) }]
      .sort((a, b) => a.value - b.value);

    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm text-neutral-500">Solved in</p>
        <h1 className="text-3xl font-medium">{elapsed}s</h1>
        <div className="w-full max-w-xs text-left">
          <p className="text-xs text-neutral-500 mb-2">Today's speed board</p>
          <ol className="text-sm space-y-1">
            {board.map((r, i) => (
              <li
                key={r.name}
                className={`flex justify-between ${r.name === "You" ? "font-medium" : ""}`}
              >
                <span>{i + 1}. {r.name}</span>
                <span>{r.value}s</span>
              </li>
            ))}
          </ol>
        </div>
        <Link href="/" className="text-sm underline mt-4">Back to deck</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      {isDebut && (
        <p className="text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          New word debut
        </p>
      )}
      <p className="text-sm text-neutral-500">Today's puzzle · type the word</p>

      <div
        className={`w-72 rounded-2xl border px-6 py-8 text-center
          ${isDebut ? "border-amber-400 bg-amber-50" : "border-neutral-300 bg-white"}`}
      >
        <p className="text-base">{card.definition}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col items-center gap-3 w-72">
        <input
          ref={inputRef}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Your answer"
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-center"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-neutral-900 text-white text-sm hover:bg-neutral-800"
        >
          Submit
        </button>
        {result === "wrong" && (
          <p className="text-sm text-red-600">Not quite — try again</p>
        )}
      </form>
    </main>
  );
}

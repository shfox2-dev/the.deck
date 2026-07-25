"use client";

import { useState } from "react";
import Link from "next/link";
import { getDecks } from "@/lib/decks";
import { logPracticeToday, computeStreak, getPracticeLog } from "@/lib/streak";

export default function Practice() {
  // TODO: once accounts/rosters exist, use the student's actual assigned
  // group instead of always the first deck.
  const [deckCards] = useState(() => getDecks()[0].cards);
  const [index, setIndex] = useState(0);
  const [known, setKnown] = useState([]);
  const [unknown, setUnknown] = useState([]);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(computeStreak(getPracticeLog()));
  const [flipped, setFlipped] = useState(false);

  const card = deckCards[index];

  function mark(result) {
    if (result === "known") setKnown((k) => [...k, card.id]);
    else setUnknown((u) => [...u, card.id]);

    if (index + 1 >= deckCards.length) {
      setStreak(logPracticeToday());
      setDone(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted">Session complete</p>
        <h1 className="text-2xl font-medium text-ink">
          {known.length} known · {unknown.length} to review
        </h1>
        <p className="text-lg text-ink">
          Your streak is now <span className="font-medium text-gold-ink">{streak}</span> day
          {streak === 1 ? "" : "s"}
        </p>
        <Link href="/" className="text-sm underline text-muted mt-4">
          Back to deck
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-8 px-6">
      <p className="text-sm text-muted">
        Card {index + 1} of {deckCards.length} · Streak: {streak}
      </p>

      <div
        onClick={() => setFlipped((f) => !f)}
        className="w-72 h-44 rounded-2xl border border-border bg-surface
                   flex items-center justify-center text-center px-6 cursor-pointer select-none"
      >
        <span className="text-lg font-medium text-ink">
          {flipped ? card.definition : card.word}
        </span>
      </div>
      <p className="text-xs text-muted -mt-4">Tap the card to flip it</p>

      <div className="flex gap-4">
        <button
          onClick={() => mark("unknown")}
          className="px-5 py-2 rounded-lg border border-border bg-surface text-sm text-ink"
        >
          Still learning
        </button>
        <button
          onClick={() => mark("known")}
          className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm"
        >
          I know this
        </button>
      </div>
    </main>
  );
}

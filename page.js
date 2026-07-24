"use client";

import { useState } from "react";
import Link from "next/link";
import { DECK } from "@/lib/mockData";
import { logPracticeToday, computeStreak, getPracticeLog } from "@/lib/streak";

export default function Practice() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState([]);
  const [unknown, setUnknown] = useState([]);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(computeStreak(getPracticeLog()));

  const card = DECK[index];

  function mark(result) {
    if (result === "known") setKnown((k) => [...k, card.id]);
    else setUnknown((u) => [...u, card.id]);

    if (index + 1 >= DECK.length) {
      setStreak(logPracticeToday());
      setDone(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-neutral-500">Session complete</p>
        <h1 className="text-2xl font-medium">
          {known.length} known · {unknown.length} to review
        </h1>
        <p className="text-lg">
          Your streak is now <span className="font-medium">{streak}</span> day
          {streak === 1 ? "" : "s"}
        </p>
        <Link href="/" className="text-sm underline mt-4">
          Back to deck
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
      <p className="text-sm text-neutral-500">
        Card {index + 1} of {DECK.length} · Streak: {streak}
      </p>

      <div
        onClick={() => setFlipped((f) => !f)}
        className="w-72 h-44 rounded-2xl border border-neutral-300 bg-white
                   flex items-center justify-center text-center px-6 cursor-pointer select-none"
      >
        <span className="text-lg font-medium">
          {flipped ? card.definition : card.word}
        </span>
      </div>
      <p className="text-xs text-neutral-500 -mt-4">Tap the card to flip it</p>

      <div className="flex gap-4">
        <button
          onClick={() => mark("unknown")}
          className="px-5 py-2 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50"
        >
          Still learning
        </button>
        <button
          onClick={() => mark("known")}
          className="px-5 py-2 rounded-lg border border-neutral-300 bg-neutral-900 text-white text-sm hover:bg-neutral-800"
        >
          I know this
        </button>
      </div>
    </main>
  );
}

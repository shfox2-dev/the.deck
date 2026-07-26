"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getDecks } from "@/lib/decks";
import { logPracticeToday, computeStreak, getPracticeLog } from "@/lib/streak";
import BurgerMenu from "@/components/BurgerMenu";
import FlashCard from "@/components/FlashCard";

export default function Practice() {
  // TODO: once accounts/rosters exist, use the student's actual assigned
  // group instead of always the first deck.
  const [deck] = useState(() => getDecks()[0]);
  const [mode, setMode] = useState(null); // null | "matching" | "expert"

  return (
    <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-8 px-6 py-16">
      <BurgerMenu />

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
// Matching mode: 4 cards at a time, drawn from the same group so they're
// genuinely easy to confuse. Drag a term onto its matching definition.
// ---------------------------------------------------------------------------
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickRound(deck) {
  const groups = deck.groups || [];
  const eligible = groups.filter((g) => deck.cards.some((c) => c.groupId === g.id));
  const pool = eligible.length > 0
    ? deck.cards.filter((c) => c.groupId === eligible[Math.floor(Math.random() * eligible.length)].id)
    : deck.cards; // fall back to the whole deck if nothing is grouped yet

  return shuffle(pool).slice(0, Math.min(4, pool.length));
}

function MatchingMode({ deck, onExit }) {
  const [round, setRound] = useState(() => pickRound(deck));
  const [termOrder, setTermOrder] = useState(() => shuffle(round));
  const [matched, setMatched] = useState([]); // card ids matched so far
  const [shakeId, setShakeId] = useState(null);

  function newRound() {
    const r = pickRound(deck);
    setRound(r);
    setTermOrder(shuffle(r));
    setMatched([]);
  }

  function handleDrop(definitionCardId, draggedCardId) {
    if (draggedCardId === definitionCardId) {
      setMatched((m) => [...m, draggedCardId]);
      if (matched.length + 1 === round.length) {
        logPracticeToday();
      }
    } else {
      setShakeId(definitionCardId);
      setTimeout(() => setShakeId(null), 400);
    }
  }

  if (round.length < 2) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-off-white text-sm max-w-xs">
          This group doesn't have enough cards yet to play matching mode. Add
          a few more cards to a group in Manage decks first.
        </p>
        <button onClick={onExit} className="text-sm underline text-off-white">Back</button>
      </div>
    );
  }

  const allMatched = matched.length === round.length;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-off-white">Drag each term onto its definition</p>

      <div className="flex gap-10">
        <div className="flex flex-col gap-4">
          {round.map((card) => {
            const isMatched = matched.includes(card.id);
            return (
              <FlashCard
                key={card.id}
                size="sm"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(card.id, e.dataTransfer.getData("text/plain"))}
                className={`transition-transform ${shakeId === card.id ? "animate-pulse" : ""} ${
                  isMatched ? "opacity-60" : ""
                }`}
                style={{ outline: isMatched ? "3px solid var(--color-green-light)" : "none" }}
              >
                <p className="text-xs">{card.definition}</p>
              </FlashCard>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          {termOrder.map((card) => {
            const isMatched = matched.includes(card.id);
            return (
              <FlashCard
                key={card.id}
                size="sm"
                draggable={!isMatched}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", card.id)}
                className={isMatched ? "opacity-30" : "cursor-grab"}
              >
                <p className="text-sm font-medium">{card.word}</p>
              </FlashCard>
            );
          })}
        </div>
      </div>

      {allMatched && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-off-white text-sm">All matched!</p>
          <button onClick={newRound} className="px-4 py-2 rounded-lg bg-off-white text-blue text-sm">
            New round
          </button>
        </div>
      )}

      <button onClick={onExit} className="text-sm underline text-off-white">Change mode</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expert mode: same interaction as the daily puzzle (type the word from the
// definition), but works through the entire deck instead of one card a day.
// ---------------------------------------------------------------------------
function ExpertMode({ deck, onExit }) {
  const [order] = useState(() => shuffle(deck.cards));
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [wrong, setWrong] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(computeStreak(getPracticeLog()));
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
      setStreak(logPracticeToday());
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
        <p className="text-off-white text-sm">
          Streak is now <span className="text-gold-med font-medium">{streak}</span> day{streak === 1 ? "" : "s"}
        </p>
        <button onClick={onExit} className="text-sm underline text-off-white mt-2">Change mode</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-off-white">Card {index + 1} of {order.length} · Streak: {streak}</p>

      <FlashCard size="md">
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
        {wrong && <p className="text-sm text-red">Not quite — try again</p>}
      </form>

      <button onClick={onExit} className="text-sm underline text-off-white">Change mode</button>
    </div>
  );
}

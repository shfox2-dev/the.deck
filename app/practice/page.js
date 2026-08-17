"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getDeck } from "@/lib/decks";
import { logPracticeToday, computeStreak, getPracticeLog } from "@/lib/streak";
import { effectiveDeckId } from "@/lib/activeDeck";
import Header from "@/components/Header";
import FlashCard from "@/components/FlashCard";
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

  return (
    <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-8 px-6 py-16">
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
// randomly (no overlap) as term tiles and definition tiles. Drag any tile
// onto any other to collapse them into a pair -- whether it's actually
// correct is hidden until Submit. Click a pair to undo it and try again.
// Mouse-only for now; touch/drag support for phones is a follow-up.
// ---------------------------------------------------------------------------
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const CONTAINER_W = 720;
const CONTAINER_H = 560;
const TILE_W = 128;
const TILE_H = 179;
const PAIR_SIZE = 96;

function pickRoundCards(deck) {
  const groups = deck.groups || [];
  const eligible = groups.filter((g) => deck.cards.filter((c) => c.groupId === g.id).length >= 2);
  const pool = eligible.length > 0
    ? deck.cards.filter((c) => c.groupId === eligible[Math.floor(Math.random() * eligible.length)].id)
    : deck.cards; // fall back to the whole deck if nothing is grouped yet

  return shuffle(pool).slice(0, Math.min(4, pool.length));
}

function randomPositions(count, w, h) {
  const placed = [];
  for (let i = 0; i < count; i++) {
    let pos = null;
    for (let attempt = 0; attempt < 200; attempt++) {
      const candidate = {
        x: Math.random() * (CONTAINER_W - w),
        y: Math.random() * (CONTAINER_H - h),
      };
      const overlaps = placed.some(
        (p) => Math.abs(p.x - candidate.x) < w + 10 && Math.abs(p.y - candidate.y) < h + 10
      );
      if (!overlaps) {
        pos = candidate;
        break;
      }
    }
    placed.push(pos || { x: (i % 4) * (w + 10), y: Math.floor(i / 4) * (h + 10) });
  }
  return placed;
}

function buildRound(deck) {
  const cards = pickRoundCards(deck);
  const rawTiles = cards.flatMap((c) => [
    { id: `${c.id}-term`, cardId: c.id, kind: "term", label: c.word },
    { id: `${c.id}-def`, cardId: c.id, kind: "def", label: c.definition },
  ]);
  const positions = randomPositions(rawTiles.length, TILE_W, TILE_H);
  const posMap = {};
  rawTiles.forEach((t, i) => (posMap[t.id] = positions[i]));
  return { cardCount: cards.length, tiles: rawTiles, positions: posMap };
}

function MatchingMode({ deck, onExit }) {
  const [round, setRound] = useState(() => buildRound(deck));
  const [pairs, setPairs] = useState([]); // { id, a, b, x, y, correct }
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef(null);
  const draggingRef = useRef(null); // { tileId, offsetX, offsetY }
  const [, forceRender] = useState(0);

  function newRound() {
    setRound(buildRound(deck));
    setPairs([]);
    setSubmitted(false);
  }

  function rectsOverlap(id1, pos1, id2, pos2) {
    return (
      pos1.x < pos2.x + TILE_W &&
      pos1.x + TILE_W > pos2.x &&
      pos1.y < pos2.y + TILE_H &&
      pos1.y + TILE_H > pos2.y
    );
  }

  function onMouseDown(tileId, e) {
    if (submitted) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = round.positions[tileId];
    draggingRef.current = {
      tileId,
      offsetX: e.clientX - rect.left - pos.x,
      offsetY: e.clientY - rect.top - pos.y,
    };
  }

  useEffect(() => {
    function onMove(e) {
      const drag = draggingRef.current;
      if (!drag || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(0, e.clientX - rect.left - drag.offsetX), CONTAINER_W - TILE_W);
      const y = Math.min(Math.max(0, e.clientY - rect.top - drag.offsetY), CONTAINER_H - TILE_H);
      round.positions[drag.tileId] = { x, y };
      forceRender((n) => n + 1);
    }

    function onUp() {
      const drag = draggingRef.current;
      if (!drag) return;
      const myPos = round.positions[drag.tileId];
      const other = round.tiles.find(
        (t) => t.id !== drag.tileId && rectsOverlap(drag.tileId, myPos, t.id, round.positions[t.id])
      );
      if (other) {
        const dropped = round.tiles.find((t) => t.id === drag.tileId);
        const dx = (myPos.x + round.positions[other.id].x) / 2 + TILE_W / 2 - PAIR_SIZE / 2;
        const dy = (myPos.y + round.positions[other.id].y) / 2 + TILE_H / 2 - PAIR_SIZE / 2;
        const label = dropped.kind === "term" ? dropped.label : other.kind === "term" ? other.label : `${dropped.label} / ${other.label}`;
        setPairs((p) => [
          ...p,
          {
            id: `${dropped.id}+${other.id}`,
            a: dropped,
            b: other,
            x: Math.max(0, Math.min(dx, CONTAINER_W - PAIR_SIZE)),
            y: Math.max(0, Math.min(dy, CONTAINER_H - PAIR_SIZE)),
            label,
          },
        ]);
        setRound((r) => ({ ...r, tiles: r.tiles.filter((t) => t.id !== dropped.id && t.id !== other.id) }));
      }
      draggingRef.current = null;
      forceRender((n) => n + 1);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [round]);

  function undoPair(pairId) {
    if (submitted) return;
    const pair = pairs.find((p) => p.id === pairId);
    if (!pair) return;
    setPairs((p) => p.filter((x) => x.id !== pairId));
    setRound((r) => ({
      ...r,
      tiles: [...r.tiles, pair.a, pair.b],
      positions: {
        ...r.positions,
        [pair.a.id]: { x: Math.max(0, pair.x - 60), y: pair.y },
        [pair.b.id]: { x: Math.min(CONTAINER_W - TILE_W, pair.x + 60), y: pair.y },
      },
    }));
  }

  function handleSubmit() {
    const graded = pairs.map((p) => ({
      ...p,
      correct: p.a.kind !== p.b.kind && p.a.cardId === p.b.cardId,
    }));
    setPairs(graded);
    setSubmitted(true);
    logPracticeToday();
  }

  if (round.cardCount < 2) {
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

  const allPaired = round.tiles.length === 0;
  const score = submitted ? pairs.filter((p) => p.correct).length : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-off-white">Drag any two tiles together to pair them</p>

      <div
        ref={containerRef}
        className="relative bg-green-dark/40 rounded-xl border border-green-light/30"
        style={{ width: CONTAINER_W, height: CONTAINER_H }}
      >
        {round.tiles.map((tile) => {
          const pos = round.positions[tile.id];
          return (
            <FlashCard
              key={tile.id}
              size="sm"
              onMouseDown={(e) => onMouseDown(tile.id, e)}
              style={{ position: "absolute", left: pos.x, top: pos.y, cursor: "grab", userSelect: "none" }}
            >
              <p className={tile.kind === "term" ? "text-lg font-medium" : "text-lg"}>{tile.label}</p>
            </FlashCard>
          );
        })}

        {pairs.map((pair) => (
          <div
            key={pair.id}
            onClick={() => undoPair(pair.id)}
            style={{
              position: "absolute",
              left: pair.x,
              top: pair.y,
              width: PAIR_SIZE,
              height: PAIR_SIZE,
              boxShadow: submitted
                ? pair.correct
                  ? "4px 0 2px 0 var(--color-green-light)"
                  : "4px 0 2px 0 var(--color-red)"
                : "4px 0 2px 0 var(--color-green-dark)",
            }}
            className={`rounded-lg flex items-center justify-center text-center px-2 cursor-pointer
              ${submitted ? (pair.correct ? "bg-green-light text-green-dark" : "bg-pink text-red") : "bg-off-white text-blue"}`}
          >
            <p className="text-xs font-medium">{pair.label}</p>
          </div>
        ))}
      </div>

      {!submitted && allPaired && (
        <button onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-green-light text-green-dark text-sm">
          Submit
        </button>
      )}

      {submitted && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-off-white text-sm">{score} of {round.cardCount} correct</p>
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
        {wrong && <p className="text-sm text-red">Not quite — try again</p>}
      </form>

      <button onClick={onExit} className="text-sm underline text-off-white">Change mode</button>
    </div>
  );
}

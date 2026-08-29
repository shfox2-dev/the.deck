"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDeck } from "@/lib/decks";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import FlashCard from "@/components/FlashCard";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";

const CONTAINER_W = 720;
const CONTAINER_H = 560;
const TILE_W = 128;
const TILE_H = 179;
const PAIR_SIZE = 96;

function randomPositions(count, w, h) {
  const placed = [];
  for (let i = 0; i < count; i++) {
    let pos = null;
    for (let attempt = 0; attempt < 200; attempt++) {
      const candidate = { x: Math.random() * (CONTAINER_W - w), y: Math.random() * (CONTAINER_H - h) };
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

export default function DuelMatch() {
  return (
    <AuthGate>
      <DuelMatchContent />
    </AuthGate>
  );
}

function DuelMatchContent() {
  const { duelId } = useParams();
  const searchParams = useSearchParams();
  const { roster } = useAuth();

  const deckId = searchParams.get("deckId");
  const cardIds = (searchParams.get("cards") || "").split(",").filter(Boolean);
  const opponentName = searchParams.get("opponentName") || "your opponent";

  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(null); // { tiles, positions }
  const [pairs, setPairs] = useState([]);
  const [result, setResult] = useState(null); // null | "you" | "opponent"
  const [wrongFlash, setWrongFlash] = useState(false);
  const containerRef = useRef(null);
  const draggingRef = useRef(null);
  const [, forceRender] = useState(0);
  const channelRef = useRef(null);

  // Load the deck, then build the round from the exact card ids the
  // challenger picked -- both players get the identical cards this way.
  useEffect(() => {
    if (!deckId) {
      setLoading(false);
      return;
    }
    getDeck(deckId).then((d) => {
      setDeck(d);
      if (d) {
        const cards = cardIds.map((id) => d.cards.find((c) => c.id === id)).filter(Boolean);
        const tiles = cards.flatMap((c) => [
          { id: `${c.id}-term`, cardId: c.id, kind: "term", label: c.word },
          { id: `${c.id}-def`, cardId: c.id, kind: "def", label: c.definition },
        ]);
        const positions = randomPositions(tiles.length, TILE_W, TILE_H);
        const posMap = {};
        tiles.forEach((t, i) => (posMap[t.id] = positions[i]));
        setRound({ tiles, positions: posMap, total: cards.length });
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Listen for the opponent finishing first.
  useEffect(() => {
    if (!duelId) return;
    const supabase = createClient();
    const channel = supabase.channel(`duel:${duelId}`);
    channelRef.current = channel;
    channel
      .on("broadcast", { event: "finished" }, ({ payload }) => {
        if (payload.email !== roster.email) {
          setResult((prev) => prev || "opponent");
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelId]);

  function rectsOverlap(pos1, pos2) {
    return (
      pos1.x < pos2.x + TILE_W && pos1.x + TILE_W > pos2.x &&
      pos1.y < pos2.y + TILE_H && pos1.y + TILE_H > pos2.y
    );
  }

  function onMouseDown(tileId, e) {
    if (result) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = round.positions[tileId];
    draggingRef.current = { tileId, offsetX: e.clientX - rect.left - pos.x, offsetY: e.clientY - rect.top - pos.y };
  }

  useEffect(() => {
    function onMove(e) {
      const drag = draggingRef.current;
      if (!drag || !containerRef.current || !round) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(0, e.clientX - rect.left - drag.offsetX), CONTAINER_W - TILE_W);
      const y = Math.min(Math.max(0, e.clientY - rect.top - drag.offsetY), CONTAINER_H - TILE_H);
      round.positions[drag.tileId] = { x, y };
      forceRender((n) => n + 1);
    }
    function onUp() {
      const drag = draggingRef.current;
      if (!drag || !round) return;
      const myPos = round.positions[drag.tileId];
      const other = round.tiles.find(
        (t) => t.id !== drag.tileId && rectsOverlap(myPos, round.positions[t.id])
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
            correct: null,
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
    if (result) return;
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
    const graded = pairs.map((p) => ({ ...p, correct: p.a.kind !== p.b.kind && p.a.cardId === p.b.cardId }));
    setPairs(graded);
    const allCorrect = graded.every((p) => p.correct);
    if (allCorrect) {
      setResult((prev) => prev || "you");
      channelRef.current?.send({ type: "broadcast", event: "finished", payload: { email: roster.email } });
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 1500);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-green-dark flex items-center justify-center">
        <Header />
      </main>
    );
  }

  if (!deck || !round) {
    return (
      <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Header />
        <p className="text-off-white text-sm">This duel link isn't valid.</p>
        <Link href="/duel" className="text-sm underline text-off-white">Back to Duel</Link>
      </main>
    );
  }

  if (result) {
    return (
      <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Header />
        <h1 className="text-3xl font-medium text-off-white">
          {result === "you" ? "You won!" : `${opponentName} won this time`}
        </h1>
        <Link href="/duel" className="text-sm underline text-off-white mt-2">Back to Duel</Link>
      </main>
    );
  }

  const allPaired = round.tiles.length === 0;

  return (
    <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-4 px-6 py-12">
      <Header />
      <p className="text-sm text-off-white">Racing against {opponentName}</p>

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
              boxShadow:
                pair.correct === true
                  ? "4px 0 2px 0 var(--color-green-light)"
                  : pair.correct === false
                  ? "4px 0 2px 0 var(--color-red)"
                  : "4px 0 2px 0 var(--color-green-dark)",
            }}
            className={`rounded-lg flex items-center justify-center text-center px-2 cursor-pointer
              ${pair.correct === true ? "bg-green-light text-green-dark" : pair.correct === false ? "bg-pink text-red" : "bg-off-white text-blue"}`}
          >
            <p className="text-xs font-medium">{pair.label}</p>
          </div>
        ))}
      </div>

      {allPaired && (
        <button onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-green-light text-green-dark text-sm">
          Submit
        </button>
      )}
      {wrongFlash && <p className="text-sm text-red">Not all correct yet -- fix and resubmit</p>}
    </main>
  );
}

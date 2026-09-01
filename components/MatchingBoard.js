"use client";

import { useEffect, useRef, useState } from "react";
import FlashCard from "@/components/FlashCard";
import { fitTextSizeClass } from "@/lib/textFit";

// Desktop keeps its original fixed size. Below the sm breakpoint, everything
// scales down to fit within the actual screen width -- the play area is
// never wider than the viewport, per the "no scrolling" requirement -- and
// grows back somewhat if the phone is rotated to landscape, since the
// formula is just driven by the live window size, recomputed on rotation.
function computeLayout() {
  if (typeof window === "undefined") {
    return { containerW: 720, containerH: 560, tileW: 128, tileH: 179, pairSize: 96 };
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w >= 640) {
    return { containerW: 720, containerH: 560, tileW: 128, tileH: 179, pairSize: 96 };
  }
  const containerW = Math.min(w - 32, 600);
  const tileW = Math.max(56, Math.min(96, Math.round(containerW / 4.4)));
  const tileH = Math.round(tileW * (179 / 128)); // keep the card aspect ratio
  const containerH = Math.max(260, Math.min(h - 230, 520)); // 230 ~= header + instructions + submit button
  const pairSize = Math.round(tileW * 0.75);
  return { containerW, containerH, tileW, tileH, pairSize };
}

function randomPositions(count, tileW, tileH, containerW, containerH) {
  const placed = [];
  for (let i = 0; i < count; i++) {
    let pos = null;
    for (let attempt = 0; attempt < 300; attempt++) {
      const candidate = {
        x: Math.random() * Math.max(0, containerW - tileW),
        y: Math.random() * Math.max(0, containerH - tileH),
      };
      const overlaps = placed.some(
        (p) => Math.abs(p.x - candidate.x) < tileW + 8 && Math.abs(p.y - candidate.y) < tileH + 8
      );
      if (!overlaps) {
        pos = candidate;
        break;
      }
    }
    placed.push(pos || { x: (i % 3) * (tileW + 8), y: Math.floor(i / 3) * (tileH + 8) });
  }
  return placed;
}

function buildRound(cards, layout) {
  const tiles = cards.flatMap((c) => [
    { id: `${c.id}-term`, cardId: c.id, kind: "term", label: c.word },
    { id: `${c.id}-def`, cardId: c.id, kind: "def", label: c.definition },
  ]);
  const positions = randomPositions(tiles.length, layout.tileW, layout.tileH, layout.containerW, layout.containerH);
  const posMap = {};
  tiles.forEach((t, i) => (posMap[t.id] = positions[i]));
  return { tiles, positions: posMap };
}

// cards: up to 4 {id, word, definition}. onResult(allCorrect) fires every
// time Submit is pressed. disabled freezes the board (e.g. once an opponent
// has already won a duel).
export default function MatchingBoard({ cards, onResult, disabled = false }) {
  const [layout, setLayout] = useState(computeLayout);
  const [round, setRound] = useState(() => buildRound(cards, computeLayout()));
  const [pairs, setPairs] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const containerRef = useRef(null);
  const draggingRef = useRef(null);
  const pairsRef = useRef(pairs);
  const [, forceRender] = useState(0);

  useEffect(() => {
    pairsRef.current = pairs;
  }, [pairs]);

  // A genuinely new set of cards (new round, or a fresh duel) -- rebuild.
  useEffect(() => {
    setRound(buildRound(cards, computeLayout()));
    setPairs([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  // Recompute on resize/rotation. Mid-round with nothing paired yet, just
  // re-scatter for the new size; otherwise clamp existing positions so
  // nothing ends up stranded outside a newly-smaller area.
  useEffect(() => {
    function onResize() {
      const next = computeLayout();
      setLayout(next);
      setRound((r) => {
        if (pairsRef.current.length === 0 && r.tiles.length > 0) {
          return buildRound(cards, next);
        }
        const clamped = {};
        Object.entries(r.positions).forEach(([id, pos]) => {
          clamped[id] = {
            x: Math.min(Math.max(0, pos.x), Math.max(0, next.containerW - next.tileW)),
            y: Math.min(Math.max(0, pos.y), Math.max(0, next.containerH - next.tileH)),
          };
        });
        return { ...r, positions: clamped };
      });
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  function rectsOverlap(pos1, pos2) {
    return (
      pos1.x < pos2.x + layout.tileW && pos1.x + layout.tileW > pos2.x &&
      pos1.y < pos2.y + layout.tileH && pos1.y + layout.tileH > pos2.y
    );
  }

  // Pointer Events unify mouse, touch, and pen into one code path -- this is
  // the actual fix for "can't drag on the phone." touch-action: none (set
  // below, on both the container and each tile) stops the browser from
  // hijacking the gesture as a scroll/zoom before it reaches our handler.
  function onPointerDown(tileId, e) {
    if (disabled) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const rect = containerRef.current.getBoundingClientRect();
    const pos = round.positions[tileId];
    draggingRef.current = { tileId, offsetX: e.clientX - rect.left - pos.x, offsetY: e.clientY - rect.top - pos.y };
  }

  useEffect(() => {
    function onMove(e) {
      const drag = draggingRef.current;
      if (!drag || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(0, e.clientX - rect.left - drag.offsetX), layout.containerW - layout.tileW);
      const y = Math.min(Math.max(0, e.clientY - rect.top - drag.offsetY), layout.containerH - layout.tileH);
      round.positions[drag.tileId] = { x, y };
      forceRender((n) => n + 1);
    }
    function onUp() {
      const drag = draggingRef.current;
      if (!drag) return;
      const myPos = round.positions[drag.tileId];
      const other = round.tiles.find(
        (t) => t.id !== drag.tileId && rectsOverlap(myPos, round.positions[t.id])
      );
      if (other) {
        const dropped = round.tiles.find((t) => t.id === drag.tileId);
        const dx = (myPos.x + round.positions[other.id].x) / 2 + layout.tileW / 2 - layout.pairSize / 2;
        const dy = (myPos.y + round.positions[other.id].y) / 2 + layout.tileH / 2 - layout.pairSize / 2;
        const label = dropped.kind === "term" ? dropped.label : other.kind === "term" ? other.label : `${dropped.label} / ${other.label}`;
        setPairs((p) => [
          ...p,
          {
            id: `${dropped.id}+${other.id}`,
            a: dropped,
            b: other,
            x: Math.max(0, Math.min(dx, layout.containerW - layout.pairSize)),
            y: Math.max(0, Math.min(dy, layout.containerH - layout.pairSize)),
            label,
            correct: null,
          },
        ]);
        setRound((r) => ({ ...r, tiles: r.tiles.filter((t) => t.id !== dropped.id && t.id !== other.id) }));
      }
      draggingRef.current = null;
      forceRender((n) => n + 1);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [round, layout]);

  function undoPair(pairId) {
    if (disabled) return;
    const pair = pairs.find((p) => p.id === pairId);
    if (!pair) return;
    setPairs((p) => p.filter((x) => x.id !== pairId));
    setRound((r) => ({
      ...r,
      tiles: [...r.tiles, pair.a, pair.b],
      positions: {
        ...r.positions,
        [pair.a.id]: { x: Math.max(0, pair.x - layout.tileW * 0.5), y: pair.y },
        [pair.b.id]: { x: Math.min(layout.containerW - layout.tileW, pair.x + layout.tileW * 0.5), y: pair.y },
      },
    }));
  }

  function handleSubmit() {
    const graded = pairs.map((p) => ({ ...p, correct: p.a.kind !== p.b.kind && p.a.cardId === p.b.cardId }));
    setPairs(graded);
    const allCorrect = graded.every((p) => p.correct);
    if (!allCorrect) {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 1500);
    }
    onResult(allCorrect);
  }

  const allPaired = round.tiles.length === 0 && pairs.length === cards.length;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        style={{ width: layout.containerW, height: layout.containerH, touchAction: "none" }}
        className="relative bg-green-dark/40 rounded-xl border border-green-light/30"
      >
        {round.tiles.map((tile) => {
          const pos = round.positions[tile.id];
          return (
            <FlashCard
              key={tile.id}
              onPointerDown={(e) => onPointerDown(tile.id, e)}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: layout.tileW,
                height: layout.tileH,
                cursor: disabled ? "default" : "grab",
                userSelect: "none",
                touchAction: "none",
              }}
            >
              <p className={`${fitTextSizeClass(tile.label)} ${tile.kind === "term" ? "font-medium" : ""}`}>
                {tile.label}
              </p>
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
              width: layout.pairSize,
              height: layout.pairSize,
              boxShadow:
                pair.correct === true
                  ? "4px 0 2px 0 var(--color-green-light)"
                  : pair.correct === false
                  ? "4px 0 2px 0 var(--color-red)"
                  : "4px 0 2px 0 var(--color-green-dark)",
            }}
            className={`rounded-lg flex items-center justify-center text-center px-2
              ${disabled ? "" : "cursor-pointer"}
              ${pair.correct === true ? "bg-green-light text-green-dark" : pair.correct === false ? "bg-pink text-red" : "bg-off-white text-blue"}`}
          >
            <p className={`${fitTextSizeClass(pair.label)} font-medium`}>{pair.label}</p>
          </div>
        ))}
      </div>

      {allPaired && !disabled && (
        <button onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-green-light text-green-dark text-sm">
          Submit
        </button>
      )}
      {wrongFlash && <p className="text-sm text-red">Not all correct yet -- fix and resubmit</p>}
    </div>
  );
}

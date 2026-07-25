"use client";
import { useState } from "react";
import Link from "next/link";
import { DECK, CURRENT_GROUP } from "@/lib/mockData";

const ENTRANCES = [
  { href: "/daily", label: "Daily puzzle", icon: "⚡" },
  { href: "/practice", label: "Practice", icon: "🂡" },
  { href: "/duel", label: "Duel", icon: "⚔" },
];

// Tune these two together: CARD_WIDTH is the true rendered width (must match
// the w-* class below), OVERLAP_RATIO controls how much of each card peeks
// out. Higher ratio = more overlap = more cards fit on screen at once.
const CARD_WIDTH = 160; // px, matches className="w-40"
const OVERLAP_RATIO = 0.7; // 0 = no overlap, closer to 1 = mostly hidden
const OVERLAP_PX = CARD_WIDTH * OVERLAP_RATIO;

export default function Home() {
  // Track which card is hovered so we can force its z-index above everything
  // else via inline style -- a hover: class can't win against inline zIndex.
  const [hoveredKey, setHoveredKey] = useState(null);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-6 py-20">
      <div className="text-center">
        <p className="text-sm text-neutral-500">{CURRENT_GROUP}</p>
        <h1 className="text-2xl font-medium mt-1">Your deck</h1>
      </div>

      {/* overflow-x-auto is the safety net: if the row is ever wider than the
          screen (more cards, bigger cards, smaller devices), it scrolls
          instead of silently running off the edge. */}
      <div className="w-full overflow-x-auto">
        <div className="flex px-8 py-8 w-max mx-auto">
          {ENTRANCES.map((e, i) => (
            <Link
              key={e.href}
              href={e.href}
              onMouseEnter={() => setHoveredKey(e.href)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                marginLeft: i === 0 ? 0 : -64,
                zIndex: hoveredKey === e.href ? 999 : DECK.length + 3 - i,
              }}
              className="relative w-40 h-56 rounded-xl border border-neutral-300 bg-amber-50
                         flex flex-col items-center justify-center gap-2 text-center shrink-0
                         transition-transform duration-200 ease-out hover:-translate-y-6"
            >
              <span className="text-xl" aria-hidden="true">{e.icon}</span>
              <span className="text-sm font-medium text-amber-800">{e.label}</span>
            </Link>
          ))}
          {DECK.map((card, i) => (
            <div
              key={card.id}
              onMouseEnter={() => setHoveredKey(card.id)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                marginLeft: -OVERLAP_PX,
                zIndex: hoveredKey === card.id ? 999 : DECK.length - i,
              }}
              className="relative w-40 h-56 rounded-xl border border-neutral-300 bg-white
                         flex items-center justify-center text-center px-2 shrink-0
                         transition-transform duration-200 ease-out hover:-translate-y-6"
            >
              <span className="text-sm font-medium text-black">{card.word}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Hover a card to lift it into view · scroll or swipe to browse the rest
      </p>
    </main>
  );
}

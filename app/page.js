"use client";
import { useState } from "react";
import Link from "next/link";
import { getDecks } from "@/lib/decks";

const ENTRANCES = [
  { href: "/daily", label: "Daily puzzle", icon: "⚡" },
  { href: "/practice", label: "Practice", icon: "🂡" },
  { href: "/duel", label: "Duel", icon: "⚔" },
];

// Tune these two together: CARD_WIDTH is the true rendered width (must match
// the w-* class below), OVERLAP_RATIO controls how much of each card peeks
// out. Higher ratio = more overlap = more cards fit on screen at once.
const CARD_WIDTH = 240; // px, matches className="w-40"
const OVERLAP_RATIO = deck.cards.length * CARD_WIDTH; // 0 = no overlap, closer to 1 = mostly hidden
const OVERLAP_PX = CARD_WIDTH - 48 * CARD_WIDTH / OVERLAP_RATIO;
// Entrance cards use a fixed overlap instead, so they always visibly stick
// out from the deck regardless of how OVERLAP_PX is tuned.
const ENTRANCE_OVERLAP_PX = 124;

export default function Home() {
  // Track which card is hovered so we can force its z-index above everything
  // else via inline style -- a hover: class can't win against inline zIndex.
  const [hoveredKey, setHoveredKey] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // TODO: once accounts/rosters exist, this should be the student's actual
  // assigned group instead of always the first deck.
  const [deck] = useState(() => getDecks()[0]);

  return (
    <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-10 px-6 py-20 relative">
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
              Home
            </Link>
            <Link href="/admin" className="text-green-dark text-sm font-medium" onClick={() => setMenuOpen(false)}>
              Manage decks
            </Link>
          </nav>
        </div>
      )}

      <div className="text-center">
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
                marginLeft: i === 0 ? 0 : -ENTRANCE_OVERLAP_PX,
                zIndex: hoveredKey === e.href ? 999 : deck.cards.length + 3 - i,
              }}
              className="relative w-60 h-96 rounded-xl border border-red bg-off-white
                         flex flex-col items-center justify-center gap-2 text-center shrink-0
                         transition-transform duration-200 ease-out hover:-translate-y-6"
            >
              <span className="text-xl" aria-hidden="true">{e.icon}</span>
              <span className="text-2xl font-medium text-red">{e.label}</span>
            </Link>
          ))}
          {deck.cards.map((card, i) => (
            <div
              key={card.id}
              onMouseEnter={() => setHoveredKey(card.id)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                marginLeft: -OVERLAP_PX,
                zIndex: hoveredKey === card.id ? 999 : deck.cards.length - i,
              }}
              className="relative w-60 h-96 rounded-xl border border-blue bg-off-white
                         flex items-center justify-center text-center px-2 shrink-0
                         transition-transform duration-200 ease-out hover:-translate-y-6"
            >
              <span className="text-2xl font-medium text-blue">{card.word}</span>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}

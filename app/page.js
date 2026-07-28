"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { getDeck } from "@/lib/decks";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";

const ENTRANCES = [
  { href: "/daily", label: "The Daily Card" },
  { href: "/practice", label: "Mastery" },
  { href: "/duel", label: "Duel" },
];

const cardShadow = "5px 0 2px 0 var(--color-green-dark)";

export default function Home() {
  return (
    <AuthGate>
      <HomeContent />
    </AuthGate>
  );
}

function HomeContent() {
  // AuthGate guarantees roster is non-null by the time this renders.
  const { roster } = useAuth();
  // Track which card is hovered so we can force its z-index above everything
  // else via inline style -- a hover: class can't win against inline zIndex.
  const [hoveredKey, setHoveredKey] = useState(null);
  // Which regular deck cards are currently flipped to show their definition.
  const [flipped, setFlipped] = useState(() => new Set());
  const [deck] = useState(() => getDeck(roster.deck_id));

  const CARD_WIDTH = 240;
  const DECK_SPACE = deck.cards.length * CARD_WIDTH;
  const OVERLAP_PX = CARD_WIDTH - 124 * CARD_WIDTH / DECK_SPACE;
  const ENTRANCE_OVERLAP_PX = 200;

  function toggleFlip(cardId) {
    setFlipped((prev) => {
      const next = new Set(prev);
      next.has(cardId) ? next.delete(cardId) : next.add(cardId);
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center gap-10 px-6 py-24 relative">
      <Header />

      {/* Desktop / tablet: the fanned, hoverable deck. Hidden on small screens
          in favor of the one-card-at-a-time swipe view below. */}
      <div className="hidden sm:block w-full overflow-x-auto" style={{ perspective: 1200 }}>
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
                boxShadow: cardShadow,
              }}
              className="relative w-60 h-[21rem] rounded-xl bg-off-white
                         flex flex-col items-center justify-center gap-2 text-center shrink-0
                         transition-transform duration-200 ease-out hover:-translate-y-6"
            >
              <span className="text-4xl font-medium text-red px-2">{e.label}</span>
            </Link>
          ))}
          {deck.cards.map((card, i) => {
            const isFlipped = flipped.has(card.id);
            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredKey(card.id)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => toggleFlip(card.id)}
                style={{
                  marginLeft: -OVERLAP_PX,
                  zIndex: hoveredKey === card.id ? 999 : deck.cards.length - i,
                  boxShadow: cardShadow,
                }}
                className="relative w-60 h-[21rem] rounded-xl shrink-0 cursor-pointer
                           transition-transform duration-200 ease-out hover:-translate-y-6"
              >
                <div
                  style={{
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.5s",
                  }}
                  className="absolute inset-0"
                >
                  <div
                    style={{ backfaceVisibility: "hidden" }}
                    className="absolute inset-0 rounded-xl bg-off-white flex items-center justify-center text-center px-3"
                  >
                    <span className="text-4xl font-medium text-blue">{card.word}</span>
                  </div>
                  <div
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    className="absolute inset-0 rounded-xl bg-off-white flex items-center justify-center text-center px-3"
                  >
                    <span className="text-xl text-blue">{card.definition}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: one card at a time, swipe left/right to browse. */}
      <MobileDeck deck={deck} flipped={flipped} onToggleFlip={toggleFlip} />
    </main>
  );
}

function MobileDeck({ deck, flipped, onToggleFlip }) {
  const items = [
    ...ENTRANCES.map((e) => ({ type: "entrance", ...e })),
    ...deck.cards.map((c) => ({ type: "card", ...c })),
  ];
  const [index, setIndex] = useState(0);
  const touchX = useRef(0);

  function onTouchStart(e) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx < -40) setIndex((i) => Math.min(i + 1, items.length - 1));
    else if (dx > 40) setIndex((i) => Math.max(i - 1, 0));
  }

  const item = items[index];
  const isFlipped = item.type === "card" && flipped.has(item.id);

  return (
    <div
      className="flex sm:hidden flex-col items-center gap-4 w-full"
      style={{ perspective: 1200 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {item.type === "entrance" ? (
        <Link
          href={item.href}
          style={{ boxShadow: cardShadow }}
          className="relative w-60 h-[21rem] rounded-xl bg-off-white flex items-center justify-center text-center px-3"
        >
          <span className="text-4xl font-medium text-red px-2">{item.label}</span>
        </Link>
      ) : (
        <div
          onClick={() => onToggleFlip(item.id)}
          style={{ boxShadow: cardShadow }}
          className="relative w-60 h-[21rem] rounded-xl cursor-pointer"
        >
          <div
            style={{
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transformStyle: "preserve-3d",
              transition: "transform 0.5s",
            }}
            className="absolute inset-0"
          >
            <div
              style={{ backfaceVisibility: "hidden" }}
              className="absolute inset-0 rounded-xl bg-off-white flex items-center justify-center text-center px-3"
            >
              <span className="text-4xl font-medium text-blue">{item.word}</span>
            </div>
            <div
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              className="absolute inset-0 rounded-xl bg-off-white flex items-center justify-center text-center px-3"
            >
              <span className="text-xl text-blue">{item.definition}</span>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-off-white">
        {index + 1} / {items.length} · swipe to browse
      </p>
    </div>
  );
}

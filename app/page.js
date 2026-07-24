"use client";

import Link from "next/link";
import { DECK, CURRENT_GROUP } from "@/lib/mockData";

const ENTRANCES = [
  { href: "/daily", label: "Daily puzzle", icon: "⚡" },
  { href: "/practice", label: "Practice", icon: "🂡" },
  { href: "/duel", label: "Duel", icon: "⚔" },
];

export default function Home() {
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="text-center">
        <p className="text-sm text-neutral-500">{CURRENT_GROUP}</p>
        <h1 className="text-2xl font-medium mt-1">Your deck</h1>
      </div>

      <div className="flex">
        {ENTRANCES.map((e, i) => (
          <Link
            key={e.href}
            href={e.href}
            style={{ marginLeft: i === 0 ? 0 : -54, zIndex: DECK.length - i  }}
            className="relative w-24 h-36 rounded-xl border border-neutral-300 bg-amber-50
                       flex flex-col items-center justify-center gap-2 text-center
                       transition-transform duration-200 ease-out hover:-translate-y-6 hover:z-DECK.length + 1"     
          >
            <span className="text-xl" aria-hidden="true">{e.icon}</span>
            <span className="text-sm font-medium text-amber-800">{e.label}</span>
          </Link>
        ))}

        {DECK.slice(0, 3).map((card, i) => (
          <div
            key={card.id}
            style={{ marginLeft: -54, zIndex: DECK.length - 3 - i }}
            className="relative w-24 h-36 rounded-xl border border-neutral-300 bg-white
                       flex items-center justify-center text-center px-2
                       transition-transform duration-200 ease-out hover:-translate-y-6 hover:z-DECK.length + 1"
          >
            <span className="text-sm font-medium text-black">{card.word}</span>
          </div>
        ))}     
          
      </div>
     
      <p className="text-xs text-neutral-500">
        Hover a card to lift it into view · swipe to browse the rest on mobile
      </p>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { getDecks, addDeck } from "@/lib/decks";

export default function AdminHome() {
  const [decks, setDecks] = useState(() => getDecks());
  const [name, setName] = useState("");

  function handleAddDeck(e) {
    e.preventDefault();
    if (!name.trim()) return;
    addDeck(name.trim());
    setDecks(getDecks());
    setName("");
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center gap-10 px-6 py-16">
      <div className="text-center">
        <p className="text-sm text-muted">Manage decks</p>
        <h1 className="text-2xl font-medium mt-1 text-ink">Your groups</h1>
      </div>

      <ul className="w-full max-w-sm flex flex-col gap-3">
        {decks.map((deck) => (
          <li key={deck.id}>
            <Link
              href={`/admin/${deck.id}`}
              className="flex items-center justify-between border border-border bg-surface rounded-lg px-4 py-3"
            >
              <span className="text-sm font-medium text-ink">{deck.name}</span>
              <span className="text-xs text-muted">{deck.cards.length} cards</span>
            </Link>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddDeck} className="w-full max-w-sm flex flex-col gap-3">
        <label className="text-xs text-muted">New group / deck name</label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Algebra III"
            className="flex-1 border border-border bg-surface rounded-lg px-3 py-2 text-sm text-ink"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm"
          >
            Add
          </button>
        </div>
      </form>

      <Link href="/" className="text-sm underline text-muted">
        Back to deck view
      </Link>
    </main>
  );
}

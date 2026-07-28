"use client";

import { useState } from "react";
import Link from "next/link";
import { getDecks, addDeck } from "@/lib/decks";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";

export default function AdminHome() {
  return (
    <AuthGate adminOnly>
      <AdminHomeContent />
    </AuthGate>
  );
}

function AdminHomeContent() {
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
    <main className="min-h-screen bg-green-dark flex flex-col items-center gap-10 px-6 py-16">
      <Header />

      <div className="text-center">
        <p className="text-sm text-off-white">Manage decks</p>
        <h1 className="text-2xl font-medium mt-1 text-off-white">Your groups</h1>
      </div>

      <ul className="w-full max-w-sm flex flex-col gap-3">
        {decks.map((deck) => (
          <li key={deck.id}>
            <Link
              href={`/admin/${deck.id}`}
              className="flex items-center justify-between rounded-lg px-4 py-3 bg-off-white"
              style={{ boxShadow: "0 6px 0 0 var(--color-blue)" }}
            >
              <span className="text-sm font-medium text-blue">{deck.name}</span>
              <span className="text-xs text-blue/70">{deck.cards.length} cards</span>
            </Link>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddDeck} className="w-full max-w-sm flex flex-col gap-3">
        <label className="text-xs text-off-white">New group / deck name</label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Algebra III"
            className="flex-1 border border-blue bg-off-white rounded-lg px-3 py-2 text-sm text-blue"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-green-light text-green-dark text-sm"
          >
            Add
          </button>
        </div>
      </form>
    </main>
  );
}

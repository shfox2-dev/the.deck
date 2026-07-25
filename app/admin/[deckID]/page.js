"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDeck, addCard, deleteCard, isDebutToday } from "@/lib/decks";

export default function DeckAdmin() {
  const { deckId } = useParams();
  const [deck, setDeck] = useState(() => getDeck(deckId));
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [debutDate, setDebutDate] = useState("");

  function refresh() {
    setDeck(getDeck(deckId));
  }

  function handleAddCard(e) {
    e.preventDefault();
    if (!word.trim() || !definition.trim()) return;
    addCard(deckId, { word: word.trim(), definition: definition.trim(), debutDate: debutDate || null });
    setWord("");
    setDefinition("");
    setDebutDate("");
    refresh();
  }

  function handleDelete(cardId) {
    deleteCard(deckId, cardId);
    refresh();
  }

  if (!deck) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-muted">Deck not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-sm text-muted">Editing</p>
        <h1 className="text-2xl font-medium mt-1 text-ink">{deck.name}</h1>
      </div>

      <form onSubmit={handleAddCard} className="w-full max-w-sm flex flex-col gap-3 border border-border bg-surface rounded-xl p-5">
        <p className="text-xs text-muted">Add a new card</p>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Vocabulary word"
          className="border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface"
        />
        <textarea
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="Definition"
          rows={2}
          className="border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface"
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">
            Debut date (optional) — the day this card gets the gold treatment
          </label>
          <input
            type="date"
            value={debutDate}
            onChange={(e) => setDebutDate(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm"
        >
          Add card
        </button>
      </form>

      <ul className="w-full max-w-sm flex flex-col gap-2">
        {deck.cards.map((card) => (
          <li
            key={card.id}
            className={`flex items-center justify-between border rounded-lg px-4 py-3
              ${isDebutToday(card) ? "border-gold-dark bg-gold/20" : "border-border bg-surface"}`}
          >
            <div>
              <p className={`text-sm font-medium ${isDebutToday(card) ? "text-gold-ink" : "text-ink"}`}>
                {card.word}
              </p>
              <p className="text-xs text-muted">{card.definition}</p>
              {card.debutDate && (
                <p className="text-xs text-gold-ink mt-1">Debuts {card.debutDate}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(card.id)}
              aria-label={`Delete ${card.word}`}
              className="text-xs text-brand-red"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <Link href="/admin" className="text-sm underline text-muted">
        Back to all decks
      </Link>
    </main>
  );
}

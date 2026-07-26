"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDeck, addCard, deleteCard, isDebutToday, addGroup, setCardGroup } from "@/lib/decks";

export default function DeckAdmin() {
  // NOTE: this key must match the folder name exactly -- a folder named
  // [deckID] gives you params.deckID, not params.deckId. Keep this in sync
  // if the folder is ever renamed.
  const { deckID } = useParams();
  const [deck, setDeck] = useState(() => getDeck(deckID));
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [debutDate, setDebutDate] = useState("");
  const [groupId, setGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");

  function refresh() {
    setDeck(getDeck(deckID));
  }

  function handleAddGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    addGroup(deckID, newGroupName.trim());
    setNewGroupName("");
    refresh();
  }

  function handleAddCard(e) {
    e.preventDefault();
    if (!word.trim() || !definition.trim()) return;
    addCard(deckID, {
      word: word.trim(),
      definition: definition.trim(),
      debutDate: debutDate || null,
      groupId: groupId || null,
    });
    setWord("");
    setDefinition("");
    setDebutDate("");
    refresh();
  }

  function handleDelete(cardId) {
    deleteCard(deckID, cardId);
    refresh();
  }

  function handleReassign(cardId, newGroupId) {
    setCardGroup(deckID, cardId, newGroupId);
    refresh();
  }

  if (!deck) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-muted">Deck not found.</p>
      </main>
    );
  }

  const groups = deck.groups || [];
  const ungrouped = deck.cards.filter((c) => !c.groupId);

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-sm text-muted">Editing</p>
        <h1 className="text-2xl font-medium mt-1 text-ink">{deck.name}</h1>
      </div>

      {/* Groups exist so cards that are easily confused with each other --
          e.g. multiplication facts vs. vocabulary -- can be pulled from the
          same group later to make the matching game harder. */}
      <form onSubmit={handleAddGroup} className="w-full max-w-sm flex gap-2 items-end">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-muted">New group / folder (e.g. "Multiplication facts")</label>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            className="border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface"
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm">
          Add group
        </button>
      </form>

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
          <label className="text-xs text-muted">Group (optional)</label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm text-ink bg-surface"
          >
            <option value="">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
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
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm">
          Add card
        </button>
      </form>

      {/* Cards listed by group so it's easy to see which pile a card is in. */}
      <div className="w-full max-w-sm flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">{group.name}</p>
            {deck.cards.filter((c) => c.groupId === group.id).map((card) => (
              <CardRow key={card.id} card={card} groups={groups} onDelete={handleDelete} onReassign={handleReassign} />
            ))}
          </div>
        ))}

        {ungrouped.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Ungrouped</p>
            {ungrouped.map((card) => (
              <CardRow key={card.id} card={card} groups={groups} onDelete={handleDelete} onReassign={handleReassign} />
            ))}
          </div>
        )}
      </div>

      <Link href="/admin" className="text-sm underline text-muted">
        Back to all decks
      </Link>
    </main>
  );
}

function CardRow({ card, groups, onDelete, onReassign }) {
  return (
    <div
      className={`flex items-center justify-between border rounded-lg px-4 py-3 gap-3
        ${isDebutToday(card) ? "border-gold-dark bg-gold/20" : "border-border bg-surface"}`}
    >
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${isDebutToday(card) ? "text-gold-ink" : "text-ink"}`}>
          {card.word}
        </p>
        <p className="text-xs text-muted truncate">{card.definition}</p>
        {card.debutDate && (
          <p className="text-xs text-gold-ink mt-1">Debuts {card.debutDate}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={card.groupId || ""}
          onChange={(e) => onReassign(card.id, e.target.value)}
          className="text-xs border border-border rounded-md px-2 py-1 bg-surface text-ink"
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button
          onClick={() => onDelete(card.id)}
          aria-label={`Delete ${card.word}`}
          className="text-xs text-brand-red"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDeck, addCard, deleteCard, isDebutToday, addGroup, setCardGroup } from "@/lib/decks";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";

export default function DeckAdmin() {
  return (
    <AuthGate adminOnly>
      <DeckAdminContent />
    </AuthGate>
  );
}

function DeckAdminContent() {
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
      <main className="min-h-screen bg-green-dark flex items-center justify-center">
        <Header />
        <p className="text-sm text-off-white">Deck not found.</p>
      </main>
    );
  }

  const groups = deck.groups || [];
  const ungrouped = deck.cards.filter((c) => !c.groupId);

  return (
    <main className="min-h-screen bg-green-dark flex flex-col items-center gap-8 px-6 py-16">
      <Header />

      <div className="text-center">
        <p className="text-sm text-off-white">Editing</p>
        <h1 className="text-2xl font-medium mt-1 text-off-white">{deck.name}</h1>
      </div>

      {/* Groups exist so cards that are easily confused with each other --
          e.g. multiplication facts vs. vocabulary -- can be pulled from the
          same group later to make the matching game harder. */}
      <form onSubmit={handleAddGroup} className="w-full max-w-sm flex gap-2 items-end">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-off-white">New group / folder (e.g. "Multiplication facts")</label>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            className="border border-blue rounded-lg px-3 py-2 text-sm text-blue bg-off-white"
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg bg-green-light text-green-dark text-sm">
          Add group
        </button>
      </form>

      <form onSubmit={handleAddCard} className="w-full max-w-sm flex flex-col gap-3 bg-off-white rounded-xl p-5">
        <p className="text-xs text-blue/70">Add a new card</p>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Vocabulary word"
          className="border border-blue rounded-lg px-3 py-2 text-sm text-blue bg-off-white"
        />
        <textarea
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="Definition"
          rows={2}
          className="border border-blue rounded-lg px-3 py-2 text-sm text-blue bg-off-white"
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-blue/70">Group (optional)</label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="border border-blue rounded-lg px-3 py-2 text-sm text-blue bg-off-white"
          >
            <option value="">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-blue/70">
            Debut date (optional) — the day this card gets the gold treatment
          </label>
          <input
            type="date"
            value={debutDate}
            onChange={(e) => setDebutDate(e.target.value)}
            className="border border-blue rounded-lg px-3 py-2 text-sm text-blue bg-off-white"
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg bg-green-light text-green-dark text-sm">
          Add card
        </button>
      </form>

      {/* Cards listed by group so it's easy to see which pile a card is in. */}
      <div className="w-full max-w-sm flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-2">
            <p className="text-xs font-medium text-off-white uppercase tracking-wide">{group.name}</p>
            {deck.cards.filter((c) => c.groupId === group.id).map((card) => (
              <CardRow key={card.id} card={card} groups={groups} onDelete={handleDelete} onReassign={handleReassign} />
            ))}
          </div>
        ))}

        {ungrouped.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-off-white uppercase tracking-wide">Ungrouped</p>
            {ungrouped.map((card) => (
              <CardRow key={card.id} card={card} groups={groups} onDelete={handleDelete} onReassign={handleReassign} />
            ))}
          </div>
        )}
      </div>

      <Link href="/admin" className="text-sm underline text-off-white">
        Back to all decks
      </Link>
    </main>
  );
}

function CardRow({ card, groups, onDelete, onReassign }) {
  const debut = isDebutToday(card);
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-4 py-3 gap-3 ${debut ? "bg-gold-med" : "bg-off-white"}`}
      style={{ boxShadow: `0 4px 0 0 ${debut ? "var(--color-gold-dark)" : "var(--color-blue)"}` }}
    >
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${debut ? "text-gold-dark" : "text-blue"}`}>
          {card.word}
        </p>
        <p className={`text-xs truncate ${debut ? "text-gold-dark/80" : "text-blue/70"}`}>{card.definition}</p>
        {card.debutDate && (
          <p className="text-xs text-gold-dark mt-1">Debuts {card.debutDate}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={card.groupId || ""}
          onChange={(e) => onReassign(card.id, e.target.value)}
          className="text-xs border border-blue rounded-md px-2 py-1 bg-off-white text-blue"
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button
          onClick={() => onDelete(card.id)}
          aria-label={`Delete ${card.word}`}
          className="text-xs text-red"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Dynamic deck storage. Backed by localStorage for now -- once there's a
// real database, only getDecks()/saveDecks() need to change to fetch/write
// from the backend instead; everything that calls these functions can stay
// the same.
//
// Groups: cards can optionally belong to a "group" (folder) within a deck --
// e.g. "Multiplication facts" vs "Vocabulary". This exists so the future
// matching game can pull confusable cards from the same group, making the
// game harder than mixing totally unrelated cards.

const STORAGE_KEY = "decks";

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function seedDecks() {
  return [
    {
      id: "algebra-1",
      name: "Algebra I",
      groups: [{ id: "grp-vocab", name: "Vocabulary" }],
      cards: [
        { id: "c1", word: "Coefficient", definition: "A number multiplied by a variable", debutDate: null, groupId: "grp-vocab" },
        { id: "c2", word: "Variable", definition: "A symbol representing an unknown value", debutDate: null, groupId: "grp-vocab" },
        { id: "c3", word: "Exponent", definition: "Shows how many times to multiply a base by itself", debutDate: null, groupId: "grp-vocab" },
        { id: "c4", word: "Equation", definition: "A statement that two expressions are equal", debutDate: null, groupId: "grp-vocab" },
        { id: "c5", word: "Inequality", definition: "A statement comparing two values that are not equal", debutDate: null, groupId: "grp-vocab" },
        { id: "c6", word: "Slope", definition: "The steepness of a line, rise over run", debutDate: null, groupId: "grp-vocab" },
        { id: "c7", word: "Intercept", definition: "The point where a line crosses an axis", debutDate: null, groupId: "grp-vocab" },
        { id: "c8", word: "Function", definition: "A rule that assigns exactly one output to each input", debutDate: null, groupId: "grp-vocab" },
        { id: "c9", word: "Polynomial", definition: "An expression with multiple terms and whole-number exponents", debutDate: null, groupId: "grp-vocab" },
        // Debuts today by default, so the gold treatment is visible in the demo.
        { id: "c10", word: "Binomial", definition: "A polynomial with exactly two terms", debutDate: todayStr(), groupId: "grp-vocab" },
      ],
    },
    {
      id: "algebra-2",
      name: "Algebra II",
      groups: [{ id: "grp-vocab", name: "Vocabulary" }],
      cards: [
        { id: "c1", word: "Logarithm", definition: "The exponent needed to raise a base to get a number", debutDate: null, groupId: "grp-vocab" },
        { id: "c2", word: "Matrix", definition: "A rectangular array of numbers arranged in rows and columns", debutDate: null, groupId: "grp-vocab" },
      ],
    },
  ];
}

function loadFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(decks) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

export function getDecks() {
  const stored = loadFromStorage();
  if (stored) return stored;
  const seeded = seedDecks();
  persist(seeded);
  return seeded;
}

export function getDeck(deckId) {
  return getDecks().find((d) => d.id === deckId) || null;
}

export function addDeck(name) {
  const decks = getDecks();
  const id = name.toLowerCase().trim().replace(/\s+/g, "-") + "-" + Date.now().toString(36);
  const newDeck = { id, name, groups: [], cards: [] };
  const updated = [...decks, newDeck];
  persist(updated);
  return newDeck;
}

export function addGroup(deckId, name) {
  const decks = getDecks();
  const id = "grp-" + Date.now().toString(36);
  const updated = decks.map((deck) =>
    deck.id !== deckId ? deck : { ...deck, groups: [...(deck.groups || []), { id, name }] }
  );
  persist(updated);
  return updated.find((d) => d.id === deckId);
}

export function addCard(deckId, { word, definition, debutDate, groupId }) {
  const decks = getDecks();
  const updated = decks.map((deck) => {
    if (deck.id !== deckId) return deck;
    const newCard = {
      id: "c-" + Date.now().toString(36),
      word,
      definition,
      debutDate: debutDate || null,
      groupId: groupId || null,
    };
    return { ...deck, cards: [...deck.cards, newCard] };
  });
  persist(updated);
  return updated.find((d) => d.id === deckId);
}

export function setCardGroup(deckId, cardId, groupId) {
  const decks = getDecks();
  const updated = decks.map((deck) =>
    deck.id !== deckId
      ? deck
      : {
          ...deck,
          cards: deck.cards.map((c) => (c.id === cardId ? { ...c, groupId: groupId || null } : c)),
        }
  );
  persist(updated);
  return updated.find((d) => d.id === deckId);
}

export function deleteCard(deckId, cardId) {
  const decks = getDecks();
  const updated = decks.map((deck) =>
    deck.id !== deckId ? deck : { ...deck, cards: deck.cards.filter((c) => c.id !== cardId) }
  );
  persist(updated);
}

export function isDebutToday(card) {
  return !!card.debutDate && card.debutDate === todayStr();
}

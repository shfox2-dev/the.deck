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
      groups: [
        { id: "grp-mult", name: "Multiplication Facts" },
        { id: "grp-vocab", name: "Vocabulary" },
      ],
      cards: [
        { id: "c1", word: "48", definition: "6 times 8", debutDate: null, groupId: "grp-mult" },
        { id: "c2", word: "42", definition: "6 times 7", debutDate: null, groupId: "grp-mult" },
        { id: "c3", word: "28", definition: "7 times 4", debutDate: null, groupId: "grp-mult" },
        { id: "c4", word: "32", definition: "8 times 4", debutDate: null, groupId: "grp-mult" },
        { id: "c5", word: "18", definition: "6 times 3", debutDate: null, groupId: "grp-mult" },
        { id: "c6", word: "21", definition: "7 times 3", debutDate: null, groupId: "grp-mult" },
        { id: "c7", word: "24", definition: "8 times 3", debutDate: null, groupId: "grp-mult" },
        { id: "c8", word: "27", definition: "9 times 3", debutDate: null, groupId: "grp-mult" },
        { id: "c9", word: "Rate of change", definition: "How much one amount changes compared to another", debutDate: null, groupId: "grp-vocab" },
        { id: "c10", word: "Slope", definition: "The rate of change of a graph (slope)", debutDate: null, groupId: "grp-vocab" },
        { id: "c11", word: "y-intercept", definition: "Where a line touches the y-axis", debutDate: null, groupId: "grp-vocab" },
        { id: "c12", word: "x-intercept", definition: "Where a line touches the x-axis", debutDate: null, groupId: "grp-vocab" },
        { id: "c13", word: "Operations", definition: "Addition, subtraction, multiplication, division. (To name a few)", debutDate: null, groupId: "grp-vocab" },
        { id: "c14", word: "Equation", definition: "Two expressions connected by an equal sign", debutDate: null, groupId: "grp-vocab" },
        { id: "c15", word: "Slope-intercept form", definition: "y = mx + b", debutDate: null, groupId: "grp-vocab" },
        { id: "c16", word: "Point-slope form", definition: "y \u2013 y1 = m(x \u2013 x1)", debutDate: null, groupId: "grp-vocab" },
      ],
    },
    {
      id: "algebra-2",
      name: "Algebra II",
      groups: [
        { id: "grp-mult", name: "Multiplication Facts" },
        { id: "grp-vocab", name: "Vocabulary" },
      ],
      cards: [
        { id: "c1", word: "48", definition: "6 * 8", debutDate: null, groupId: "grp-mult" },
        { id: "c2", word: "42", definition: "6 * 7", debutDate: null, groupId: "grp-mult" },
        { id: "c3", word: "28", definition: "7 * 4", debutDate: null, groupId: "grp-mult" },
        { id: "c4", word: "32", definition: "8 * 4", debutDate: null, groupId: "grp-mult" },
        { id: "c5", word: "Domain", definition: "All possible x-values of a function (left to right)", debutDate: null, groupId: "grp-vocab" },
        { id: "c6", word: "Range", definition: "All possible y-values of a function (lowest to highest)", debutDate: null, groupId: "grp-vocab" },
        { id: "c7", word: "x-intercept", definition: "Where a line touches the x-axis (where y=0)", debutDate: null, groupId: "grp-vocab" },
        { id: "c8", word: "y-intercept", definition: "Where a line touches the y-axis (where x=0)", debutDate: null, groupId: "grp-vocab" },
        { id: "c9", word: "Axis of symmetry", definition: "A line across which a function is symmetrical (in the form x = ?)", debutDate: null, groupId: "grp-vocab" },
        { id: "c10", word: "Asymptote", definition: "A line that a function gets really close to but never touches", debutDate: null, groupId: "grp-vocab" },
        { id: "c11", word: "Operations", definition: "Adding, subtracting, multiplying, dividing, to name a few.", debutDate: null, groupId: "grp-vocab" },
        { id: "c12", word: "Expression", definition: "The representation of operations between variables and numbers using mathematical notation. (For example: 3x \u2013 7)", debutDate: null, groupId: "grp-vocab" },
        { id: "c13", word: "Terms", definition: "Parts of an expression which are separated by addition and subtraction.", debutDate: null, groupId: "grp-vocab" },
        { id: "c14", word: "Coefficient", definition: "A number being multiplied to a variable or expression. It is normally represented by a number in front of a variable with no symbol separating them.", debutDate: null, groupId: "grp-vocab" },
        { id: "c15", word: "Equation", definition: "Two expressions connected by an equal sign", debutDate: null, groupId: "grp-vocab" },
        { id: "c16", word: "Inequality", definition: "Two or more expressions connected by a greater than, less than, greater than or equal to, or less than or equal to symbol.", debutDate: null, groupId: "grp-vocab" },
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

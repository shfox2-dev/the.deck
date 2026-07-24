// Placeholder data. Once the roster + database exist, this file goes away
// and pages fetch from the real backend instead.

export const CURRENT_GROUP = "Algebra I";

export const DECK = [
  { id: "c1", word: "Coefficient", definition: "A number multiplied by a variable", isNew: false },
  { id: "c2", word: "Variable", definition: "A symbol representing an unknown value", isNew: false },
  { id: "c3", word: "Exponent", definition: "Shows how many times to multiply a base by itself", isNew: false },
  { id: "c4", word: "Equation", definition: "A statement that two expressions are equal", isNew: false },
  { id: "c5", word: "Inequality", definition: "A statement comparing two values that are not equal", isNew: false },
  { id: "c6", word: "Slope", definition: "The steepness of a line, rise over run", isNew: false },
  { id: "c7", word: "Intercept", definition: "The point where a line crosses an axis", isNew: false },
  { id: "c8", word: "Function", definition: "A rule that assigns exactly one output to each input", isNew: false },
  { id: "c9", word: "Polynomial", definition: "An expression with multiple terms and whole-number exponents", isNew: false },
  // Mark the most recently added card as the debut card for the demo.
  { id: "c10", word: "Binomial", definition: "A polynomial with exactly two terms", isNew: true },
];

export const MOCK_LEADERBOARD = {
  streaks: [
    { name: "Jordan P.", value: 14 },
    { name: "Ava T.", value: 11 },
    { name: "You", value: 0 },
    { name: "Mr. Reyes (teacher)", value: 22 },
  ],
  dailySpeed: [
    { name: "Ava T.", value: 3.2 },
    { name: "Jordan P.", value: 4.8 },
    { name: "Mr. Reyes (teacher)", value: 2.9 },
  ],
  duels: [
    { name: "Jordan P.", value: "9-2" },
    { name: "Ava T.", value: "6-5" },
    { name: "You", value: "0-0" },
  ],
};

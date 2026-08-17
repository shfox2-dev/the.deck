"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getDecks } from "@/lib/decks";

const ROUNDS = 5;

function shuffledDeck(cards) {
  return [...cards].sort(() => Math.random() - 0.5).slice(0, Math.min(ROUNDS, cards.length));
}

export default function Duel() {
  // TODO: once accounts/rosters exist, use the student's actual assigned
  // group instead of always the first deck.
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState("intro"); // intro | playing | roundEnd | done
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState("");
  const [youScore, setYouScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [roundWinner, setRoundWinner] = useState(null);
  const botTimer = useRef(null);

  useEffect(() => {
    getDecks().then((decks) => {
      setQuestions(shuffledDeck(decks[0]?.cards || []));
      setLoading(false);
    });
  }, []);

  function startDuel() {
    setStage("playing");
  }

  useEffect(() => {
    if (stage !== "playing" || !questions) return;
    // Bot "thinks" for a random 1.5-4s, standing in for a real opponent
    // until live matchmaking is wired up.
    const delay = 1500 + Math.random() * 2500;
    botTimer.current = setTimeout(() => {
      setBotScore((s) => s + 1);
      setRoundWinner("bot");
      setStage("roundEnd");
    }, delay);
    return () => clearTimeout(botTimer.current);
  }, [round, stage, questions]);

  // Every hook above this line runs on every render, no exceptions -- that's
  // what the Rules of Hooks require. Only now, after all hooks are declared,
  // is it safe to conditionally return early.
  if (loading) {
    return <main className="min-h-screen bg-green-dark flex items-center justify-center" />;
  }

  const card = questions[round];

  function submitGuess(e) {
    e.preventDefault();
    if (stage !== "playing") return;
    const correct = guess.trim().toLowerCase() === card.word.toLowerCase();
    if (correct) {
      clearTimeout(botTimer.current);
      setYouScore((s) => s + 1);
      setRoundWinner("you");
      setStage("roundEnd");
    }
  }

  function nextRound() {
    setGuess("");
    setRoundWinner(null);
    if (round + 1 >= questions.length) {
      setStage("done");
    } else {
      setRound((r) => r + 1);
      setStage("playing");
    }
  }

  if (stage === "intro") {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm text-muted">Live duel</p>
        <h1 className="text-2xl font-medium text-ink">Demo opponent: Bot</h1>
        <p className="text-sm text-muted max-w-xs">
          Real duels will match you with another student who is online right now.
          For now, race against a bot to try out the mode.
        </p>
        <button
          onClick={startDuel}
          className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm"
        >
          Start duel
        </button>
      </main>
    );
  }

  if (stage === "done") {
    const youWon = youScore > botScore;
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted">Final score</p>
        <h1 className="text-3xl font-medium text-ink">
          You {youScore} – {botScore} Bot
        </h1>
        <p className={`text-lg ${youWon ? "text-gold-ink font-medium" : "text-ink"}`}>
          {youWon ? "You won" : "Bot won this time"}
        </p>
        <Link href="/" className="text-sm underline text-muted mt-4">Back to deck</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm text-muted">
        Round {round + 1} of {questions.length} · You {youScore} – {botScore} Bot
      </p>

      <div className="w-72 rounded-2xl border border-border bg-surface px-6 py-8">
        <p className="text-base text-ink">{card.definition}</p>
      </div>

      {stage === "playing" && (
        <form onSubmit={submitGuess} className="flex flex-col items-center gap-3 w-72">
          <input
            autoFocus
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type the word fast"
            className="w-full border border-border bg-surface rounded-lg px-3 py-2 text-center text-ink"
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm"
          >
            Submit
          </button>
        </form>
      )}

      {stage === "roundEnd" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-ink">
            {roundWinner === "you" ? "You got it first" : "Bot got it first"} —{" "}
            <span className="font-medium">{card.word}</span>
          </p>
          <button
            onClick={nextRound}
            className="px-5 py-2 rounded-lg border border-border bg-surface text-sm text-ink"
          >
            Next round
          </button>
        </div>
      )}
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DECK } from "@/lib/mockData";

const ROUNDS = 5;

function shuffledDeck() {
  return [...DECK].sort(() => Math.random() - 0.5).slice(0, ROUNDS);
}

export default function Duel() {
  const [stage, setStage] = useState("intro"); // intro | playing | roundEnd | done
  const [questions] = useState(shuffledDeck);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState("");
  const [youScore, setYouScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [roundWinner, setRoundWinner] = useState(null);
  const botTimer = useRef(null);

  const card = questions[round];

  function startDuel() {
    setStage("playing");
  }

  useEffect(() => {
    if (stage !== "playing") return;
    // Bot "thinks" for a random 1.5-4s, standing in for a real opponent
    // until live matchmaking is wired up.
    const delay = 1500 + Math.random() * 2500;
    botTimer.current = setTimeout(() => {
      setBotScore((s) => s + 1);
      setRoundWinner("bot");
      setStage("roundEnd");
    }, delay);
    return () => clearTimeout(botTimer.current);
  }, [round, stage]);

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
    if (round + 1 >= ROUNDS) {
      setStage("done");
    } else {
      setRound((r) => r + 1);
      setStage("playing");
    }
  }

  if (stage === "intro") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm text-neutral-500">Live duel</p>
        <h1 className="text-2xl font-medium">Demo opponent: Bot</h1>
        <p className="text-sm text-neutral-500 max-w-xs">
          Real duels will match you with another student who is online right now.
          For now, race against a bot to try out the mode.
        </p>
        <button
          onClick={startDuel}
          className="px-5 py-2 rounded-lg bg-neutral-900 text-white text-sm hover:bg-neutral-800"
        >
          Start duel
        </button>
      </main>
    );
  }

  if (stage === "done") {
    const youWon = youScore > botScore;
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-neutral-500">Final score</p>
        <h1 className="text-3xl font-medium">
          You {youScore} – {botScore} Bot
        </h1>
        <p className="text-lg">{youWon ? "You won" : "Bot won this time"}</p>
        <Link href="/" className="text-sm underline mt-4">Back to deck</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm text-neutral-500">
        Round {round + 1} of {ROUNDS} · You {youScore} – {botScore} Bot
      </p>

      <div className="w-72 rounded-2xl border border-neutral-300 bg-white px-6 py-8">
        <p className="text-base">{card.definition}</p>
      </div>

      {stage === "playing" && (
        <form onSubmit={submitGuess} className="flex flex-col items-center gap-3 w-72">
          <input
            autoFocus
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type the word fast"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-center"
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-neutral-900 text-white text-sm hover:bg-neutral-800"
          >
            Submit
          </button>
        </form>
      )}

      {stage === "roundEnd" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm">
            {roundWinner === "you" ? "You got it first" : "Bot got it first"} —{" "}
            <span className="font-medium">{card.word}</span>
          </p>
          <button
            onClick={nextRound}
            className="px-5 py-2 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50"
          >
            Next round
          </button>
        </div>
      )}
    </main>
  );
}

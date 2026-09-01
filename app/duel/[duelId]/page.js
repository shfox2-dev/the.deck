"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDeck } from "@/lib/decks";
import { recordDuelResult } from "@/lib/duelLadder";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import MatchingBoard from "@/components/MatchingBoard";
import Leaderboard from "@/components/Leaderboard";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";

export default function DuelMatch() {
  return (
    <AuthGate>
      <DuelMatchContent />
    </AuthGate>
  );
}

function DuelMatchContent() {
  const { duelId } = useParams();
  const searchParams = useSearchParams();
  const { roster } = useAuth();

  const deckId = searchParams.get("deckId");
  const cardIds = (searchParams.get("cards") || "").split(",").filter(Boolean);
  const opponentEmail = searchParams.get("opponentEmail") || "";
  const opponentName = searchParams.get("opponentName") || "your opponent";

  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null); // null | "you" | "opponent"
  const channelRef = useRef(null);
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!deckId) {
      setLoading(false);
      return;
    }
    getDeck(deckId).then((d) => {
      if (d) {
        setCards(cardIds.map((id) => d.cards.find((c) => c.id === id)).filter(Boolean));
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Opponent finishing first is the only way to lose -- listen for it.
  useEffect(() => {
    if (!duelId) return;
    const supabase = createClient();
    const channel = supabase.channel(`duel:${duelId}`);
    channelRef.current = channel;
    channel
      .on("broadcast", { event: "finished" }, ({ payload }) => {
        if (payload.email !== roster.email) {
          setResult((prev) => prev || "opponent");
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelId]);

  function handleResult(allCorrect) {
    if (!allCorrect || result) return;
    setResult("you");
    channelRef.current?.send({ type: "broadcast", event: "finished", payload: { email: roster.email } });
    // Only the winner records the result -- avoids both sides racing to
    // write conflicting rows for the same duel.
    if (!recordedRef.current && opponentEmail) {
      recordedRef.current = true;
      recordDuelResult(deckId, { email: roster.email, name: roster.name }, { email: opponentEmail, name: opponentName })
        .catch((err) => console.error("Failed to record duel result:", err));
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-green-dark flex items-center justify-center">
        <Header />
      </main>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <main className="min-h-dvh bg-green-dark flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Header />
        <p className="text-off-white text-sm">This duel link isn't valid.</p>
        <Link href="/duel" className="text-sm underline text-off-white">Back to Duel</Link>
      </main>
    );
  }

  if (result) {
    const rows = result === "you"
      ? [{ name: roster.name, display: "Winner" }, { name: opponentName, display: "" }]
      : [{ name: opponentName, display: "Winner" }, { name: roster.name, display: "" }];

    return (
      <main className="min-h-dvh bg-green-dark flex flex-col items-center justify-center gap-6 px-6 text-center">
        <Header />
        <h1 className="text-3xl font-medium text-off-white">
          {result === "you" ? "You won!" : `${opponentName} won this time`}
        </h1>
        <Leaderboard rows={rows} />
        <Link href="/duel" className="text-sm underline text-off-white mt-2">Back to Duel</Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-green-dark flex flex-col items-center justify-center gap-4 px-4 py-8 overflow-hidden">
      <Header />
      <p className="text-sm text-off-white">Racing against {opponentName}</p>
      <MatchingBoard cards={cards} onResult={handleResult} disabled={!!result} />
    </main>
  );
}

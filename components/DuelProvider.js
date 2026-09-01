"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const DuelContext = createContext(null);

// NOTE: this whole system is built on Supabase Realtime Broadcast, which is
// fire-and-forget -- there's no persistence, no retry, no "missed call" log.
// If the challenged person's browser isn't actively connected at the exact
// moment a challenge is sent, they simply never see it. That's an accepted
// tradeoff for "challenge someone active right now," but it's also the part
// of this whole build I'm least able to verify without two real people
// testing at once -- flag anything that seems flaky.
export function DuelProvider({ children }) {
  const { roster } = useAuth();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [incoming, setIncoming] = useState(null); // { duelId, fromEmail, fromName, deckId, cardIds }
  const [outgoing, setOutgoing] = useState(null); // { duelId, targetEmail, targetName, status }
  const personalChannelRef = useRef(null);

  useEffect(() => {
    if (!roster?.email) return;

    const channel = supabase.channel(`user:${roster.email}`);
    personalChannelRef.current = channel;

    channel
      .on("broadcast", { event: "challenge" }, ({ payload }) => {
        setIncoming(payload);
      })
      .on("broadcast", { event: "challenge_response" }, ({ payload }) => {
        setOutgoing((prev) => {
          if (!prev || prev.duelId !== payload.duelId) return prev;
          if (payload.accepted) {
            router.push(
              `/duel/${prev.duelId}?deckId=${prev.deckId}&cards=${prev.cardIds.join(",")}` +
                `&opponentEmail=${encodeURIComponent(prev.targetEmail)}&opponentName=${encodeURIComponent(prev.targetName)}`
            );
            return null;
          }
          return { ...prev, status: "declined" };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster?.email]);

  function sendChallenge(target, deckId, cardIds, groupName) {
    const duelId = crypto.randomUUID();
    setOutgoing({ duelId, targetEmail: target.email, targetName: presenceFirstName(target), status: "waiting", deckId, cardIds });
    const targetChannel = supabase.channel(`user:${target.email}`);
    targetChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        targetChannel.send({
          type: "broadcast",
          event: "challenge",
          payload: { duelId, fromEmail: roster.email, fromName: roster.name, deckId, cardIds, groupName },
        });
        setTimeout(() => supabase.removeChannel(targetChannel), 2000);
      }
    });
  }

  function respondToChallenge(accepted) {
    if (!incoming) return;
    const challengerChannel = supabase.channel(`user:${incoming.fromEmail}`);
    challengerChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        challengerChannel.send({
          type: "broadcast",
          event: "challenge_response",
          payload: { duelId: incoming.duelId, accepted },
        });
        setTimeout(() => supabase.removeChannel(challengerChannel), 2000);
      }
    });

    if (accepted) {
      router.push(
        `/duel/${incoming.duelId}?deckId=${incoming.deckId}&cards=${incoming.cardIds.join(",")}` +
          `&opponentEmail=${encodeURIComponent(incoming.fromEmail)}&opponentName=${encodeURIComponent(incoming.fromName)}`
      );
    }
    setIncoming(null);
  }

  return (
    <DuelContext.Provider value={{ incoming, outgoing, sendChallenge, respondToChallenge, dismissOutgoing: () => setOutgoing(null) }}>
      {children}

      {incoming && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-green-dark/60 px-6">
          <div className="bg-off-white rounded-xl p-6 max-w-xs text-center flex flex-col gap-4">
            <p className="text-blue">
              <span className="font-medium">{incoming.fromName}</span> has challenged you to a duel
              {incoming.groupName ? ` in ${incoming.groupName}` : ""}. Do you accept?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => respondToChallenge(false)}
                className="px-4 py-2 rounded-lg border border-blue text-blue text-sm"
              >
                Decline
              </button>
              <button
                onClick={() => respondToChallenge(true)}
                className="px-4 py-2 rounded-lg bg-green-light text-green-dark text-sm"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {outgoing && outgoing.status === "waiting" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-off-white rounded-lg px-4 py-2 text-sm text-blue">
          Waiting for {outgoing.targetName} to respond...
        </div>
      )}
      {outgoing && outgoing.status === "declined" && (
        <div
          onClick={() => setOutgoing(null)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-off-white rounded-lg px-4 py-2 text-sm text-red cursor-pointer"
        >
          {outgoing.targetName} declined. Tap to dismiss.
        </div>
      )}
    </DuelContext.Provider>
  );
}

function presenceFirstName(person) {
  return (person.name || person.email || "").trim().split(/\s+/)[0];
}

export function useDuel() {
  const ctx = useContext(DuelContext);
  if (!ctx) throw new Error("useDuel must be used inside <DuelProvider>");
  return ctx;
}

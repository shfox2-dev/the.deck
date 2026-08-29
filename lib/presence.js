"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Presence answers the exact question raised early on: "how do you tell
// someone who just has the tab open from someone actually active?" Supabase
// Presence is backed by a live websocket -- if the connection drops (tab
// closed, phone locked, wifi lost), that person is automatically removed
// from every other client's list within seconds. No polling, no guessing.
export function useActiveUsers(deckId, me) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!deckId || !me?.email) return;
    const supabase = createClient();
    const channel = supabase.channel(`deck:${deckId}`, {
      config: { presence: { key: me.email } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setUsers(Object.values(state).flat());
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            email: me.email,
            name: me.name,
            role: me.role,
            honorific: me.honorific,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, me?.email, me?.name, me?.role, me?.honorific]);

  return users;
}

// "[first name] is active" for students, "[honorific] [last name] is
// active" for admins -- matches the spec exactly.
export function presenceLabel(person) {
  const parts = (person.name || "").trim().split(/\s+/);
  if (person.role === "admin") {
    const last = parts[parts.length - 1] || "";
    return person.honorific ? `${person.honorific} ${last}` : last;
  }
  return parts[0] || person.email;
}

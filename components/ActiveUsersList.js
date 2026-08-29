"use client";

import { useActiveUsers, presenceLabel } from "@/lib/presence";

export default function ActiveUsersList({ deckId, deckName, me }) {
  const users = useActiveUsers(deckId, me);
  const others = users.filter((u) => u.email !== me.email);

  return (
    <div className="fixed top-24 left-6 z-[850] flex flex-col gap-1.5 max-w-[190px]">
      <p className="text-green-light text-lg font-medium">{deckName}</p>
      {others.map((u) => (
        <div key={u.email} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-light shrink-0" />
          <span className="text-off-white text-xs">{presenceLabel(u)} is active</span>
        </div>
      ))}
    </div>
  );
}

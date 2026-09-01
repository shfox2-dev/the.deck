"use client";

import { useEffect, useState } from "react";
import { getDeck } from "@/lib/decks";
import { computeStreak, getPracticeLog } from "@/lib/streak";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";

export default function Profile() {
  return (
    <AuthGate>
      <ProfileContent />
    </AuthGate>
  );
}

function ProfileContent() {
  const { roster } = useAuth();
  const isAdmin = roster.role === "admin";

  return (
    <main className="min-h-dvh bg-green-dark flex flex-col items-center justify-center gap-6 px-6 text-center">
      <Header />
      <h1 className="text-2xl font-medium text-off-white">Profile</h1>
      {isAdmin ? <AdminProfile roster={roster} /> : <StudentProfile roster={roster} />}
    </main>
  );
}

function StudentProfile({ roster }) {
  const [deckName, setDeckName] = useState("...");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    getDeck(roster.deck_id).then((d) => setDeckName(d?.name || roster.deck_id));
    setStreak(computeStreak(getPracticeLog()));
  }, [roster.deck_id]);

  return (
    <div className="bg-off-white rounded-xl p-6 w-full max-w-xs flex flex-col gap-3 text-left">
      <Row label="Name" value={roster.name} />
      <Row label="Email" value={roster.email} />
      <Row label="Course" value={deckName} />
      <Row label="Streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
      <p className="text-xs text-blue/60 mt-1">
        Streak is currently tracked on this device/browser, not yet tied to your account across devices.
      </p>
    </div>
  );
}

function AdminProfile({ roster }) {
  const [honorific, setHonorific] = useState(roster.honorific || "");
  const [saved, setSaved] = useState(false);

  async function save(e) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.rpc("update_my_honorific", { new_honorific: honorific || null });
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="bg-off-white rounded-xl p-6 w-full max-w-xs flex flex-col gap-4 text-left">
      <Row label="Name" value={roster.name} />
      <Row label="Email" value={roster.email} />
      <form onSubmit={save} className="flex flex-col gap-2">
        <label className="text-xs text-blue/70">Honorific (shown in the active users list)</label>
        <div className="flex gap-2">
          <input
            value={honorific}
            onChange={(e) => setHonorific(e.target.value)}
            placeholder="e.g. Mr., Ms., Dr."
            className="flex-1 border border-blue rounded-lg px-3 py-2 text-sm text-blue bg-off-white"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-green-light text-green-dark text-sm">
            Save
          </button>
        </div>
        {saved && <p className="text-xs text-green-dark">Saved.</p>}
      </form>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs text-blue/60">{label}</p>
      <p className="text-blue">{value}</p>
    </div>
  );
}

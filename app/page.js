"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDecks } from "@/lib/decks";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";

const cardShadow = "5px 0 2px 0 var(--color-green-dark)";

export default function Home() {
  return (
    <AuthGate>
      <HomeRouter />
    </AuthGate>
  );
}

function HomeRouter() {
  const { roster } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Students have exactly one deck -- skip straight to it, no chooser.
    if (roster.role !== "admin") {
      router.replace(`/deck/${roster.deck_id}`);
    }
  }, [roster, router]);

  if (roster.role !== "admin") {
    return <main className="min-h-dvh bg-green-dark" />; // brief redirect flash
  }

  return <DeckChooser />;
}

// Admin-only: one flashcard per deck they manage. Click one to enter that
// deck's normal student-facing view.
function DeckChooser() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDecks().then((d) => {
      setDecks(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <main className="min-h-dvh bg-green-dark flex items-center justify-center">
        <Header />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-green-dark flex flex-col items-center justify-center gap-10 px-6 py-24">
      <Header />
      <div className="text-center">
        <p className="text-sm text-off-white">Admin</p>
        <h1 className="text-2xl font-medium mt-1 text-off-white">Choose your deck</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {decks.map((deck) => (
          <Link
            key={deck.id}
            href={`/deck/${deck.id}`}
            style={{ boxShadow: cardShadow }}
            className="w-60 h-[21rem] rounded-xl bg-off-white flex items-center justify-center text-center px-3
                       transition-transform duration-200 ease-out hover:-translate-y-3"
          >
            <span className="text-4xl font-medium text-blue">{deck.name}</span>
          </Link>
        ))}
      </div>

      <Link href="/admin" className="text-sm underline text-off-white">
        Manage decks and cards
      </Link>
    </main>
  );
}

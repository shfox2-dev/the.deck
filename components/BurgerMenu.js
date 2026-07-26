"use client";

import { useState } from "react";
import Link from "next/link";

// Self-contained: manages its own open/closed state, so any page can just
// drop in <BurgerMenu /> with no props and no local useState needed.
export default function BurgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="fixed top-6 left-6 z-[900] w-10 h-10 rounded-lg border border-green-light bg-green-light
                   flex flex-col items-center justify-center gap-1"
      >
        <span className="block w-5 h-0.5 bg-green-dark" />
        <span className="block w-5 h-0.5 bg-green-dark" />
        <span className="block w-5 h-0.5 bg-green-dark" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex">
          <div className="fixed inset-0 bg-green-dark/40" onClick={() => setOpen(false)} />
          <nav className="relative w-44 h-full bg-green-light border-r border-green-light p-6 flex flex-col gap-4">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="self-end text-green-dark text-sm"
            >
              Close
            </button>
            <Link href="/" className="text-green-dark text-sm font-medium" onClick={() => setOpen(false)}>
              The Deck
            </Link>
            <Link href="/admin" className="text-green-dark text-sm font-medium" onClick={() => setOpen(false)}>
              Manage decks
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

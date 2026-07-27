"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

// Logo + burger menu, combined so every page gets both with one line.
export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Link
        href="/"
        aria-label="The Deck home"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[900]"
      >
        {/* Fixed width per the design note; flag to revisit if a different
            size or per-page scaling is wanted. */}
        <Image src="/logo.png" alt="The Deck" width={240} height={69} priority />
      </Link>

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
          <nav className="relative w-56 h-full bg-green-light border-r border-green-light p-6 flex flex-col gap-5">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="self-end text-green-dark text-lg"
            >
              Close
            </button>
            <Link href="/" className="text-green-dark text-xl font-medium" onClick={() => setOpen(false)}>
              The Deck
            </Link>
            <Link href="/daily" className="text-green-dark text-xl font-medium" onClick={() => setOpen(false)}>
              The Daily Card
            </Link>
            <Link href="/practice" className="text-green-dark text-xl font-medium" onClick={() => setOpen(false)}>
              Mastery
            </Link>
            <Link href="/duel" className="text-green-dark text-xl font-medium" onClick={() => setOpen(false)}>
              Duel
            </Link>
            <Link href="/admin" className="text-green-dark text-xl font-medium" onClick={() => setOpen(false)}>
              Manage decks
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

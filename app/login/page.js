"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";

export default function Login() {
  const { user, roster, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && roster) router.replace("/");
  }, [loading, user, roster, router]);

  return (
    <main className="min-h-dvh bg-green-dark flex flex-col items-center justify-center gap-8 px-6 text-center">
      <Image src="/logo.png" alt="The Deck" width={200} height={58} priority />

      {!loading && user && !roster ? (
        <p className="text-off-white text-sm max-w-xs">
          Signed in as {user.email}, but this account isn't on the class
          roster yet. Ask your teacher to add it.
        </p>
      ) : (
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 rounded-lg bg-off-white text-blue text-lg font-medium"
        >
          Sign in with Google
        </button>
      )}
    </main>
  );
}

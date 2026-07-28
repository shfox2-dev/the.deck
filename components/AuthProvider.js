"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [roster, setRoster] = useState(null); // null = not on the roster (or not checked yet)
  const [loading, setLoading] = useState(true);

  async function loadRoster(currentUser) {
    if (!currentUser?.email) {
      setRoster(null);
      return;
    }
    // Row Level Security should restrict this to "read your own row only" --
    // see the roster.sql policy. A missing row means this email isn't on
    // the allowlist yet.
    const { data } = await supabase
      .from("roster")
      .select("name, email, role, deck_id")
      .eq("email", currentUser.email)
      .maybeSingle();
    setRoster(data || null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadRoster(session?.user ?? null).finally(() => setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadRoster(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setRoster(null);
  }

  return (
    <AuthContext.Provider value={{ user, roster, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

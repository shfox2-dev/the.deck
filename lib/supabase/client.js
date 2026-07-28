import { createBrowserClient } from "@supabase/ssr";

// Safe to use in client components. The anon key is meant to be public --
// it can only do what your database's row-level security policies allow.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AuthGate({ children, adminOnly = false }) {
  const { user, roster, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <div className="min-h-screen bg-green-dark" />;
  if (!user) return null; // redirecting to /login

  if (!roster) {
    return (
      <main className="min-h-screen bg-green-dark flex items-center justify-center px-6 text-center">
        <p className="text-off-white text-sm max-w-xs">
          This Google account ({user.email}) isn't on the class roster yet.
          Ask your teacher to add it.
        </p>
      </main>
    );
  }

  if (adminOnly && roster.role !== "admin") {
    return (
      <main className="min-h-screen bg-green-dark flex items-center justify-center px-6 text-center">
        <p className="text-off-white text-sm">You don't have access to this page.</p>
      </main>
    );
  }

  return children;
}

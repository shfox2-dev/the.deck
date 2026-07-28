import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata = {
  title: "The Deck",
  description: "Flashcard practice, daily puzzle, and duels for Algebra I and II",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* Removed the leftover font-sans class -- as a Tailwind utility class
          it was overriding the Georgia serif set in globals.css, since class
          selectors beat plain element selectors in CSS specificity. */}
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

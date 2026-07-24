import "./globals.css";

export const metadata = {
  title: "Algebra flashcards",
  description: "Flashcard practice, daily puzzle, and duels for Algebra I and II",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

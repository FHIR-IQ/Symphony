import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Impact Engine | Pharmacy AI Workshop",
  description:
    "The Impact-First AI Orchestrator: A strategic game for product managers in the pharmacy clinical ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

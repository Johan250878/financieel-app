import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financieel App",
  description: "Overzicht van inkomsten en uitgaven",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
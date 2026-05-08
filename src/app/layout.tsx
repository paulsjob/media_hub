import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEDIA LAB",
  description: "Majority Democrats media command center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--light-gray)] text-[var(--black)]">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEDIA LAB",
  description: "Internal media operations asset factory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-950">{children}</body>
    </html>
  );
}

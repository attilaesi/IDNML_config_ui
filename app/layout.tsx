import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black">
        <nav className="border-b border-gray-200 bg-white px-6 py-3 flex gap-6 text-sm">
          <Link href="/profiles" className="hover:underline">
            Profiles
          </Link>
          <Link href="/bidders" className="hover:underline">
            Bidders
          </Link>
        </nav>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
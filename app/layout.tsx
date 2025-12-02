// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "IDNML Config Admin",
  description: "UI for managing bidder and profile mappings",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* No global nav here anymore – each page renders its own
            "Profiles · Bidders" line just above the page title */}
        <main style={{ padding: "0 20px 40px 20px" }}>{children}</main>
      </body>
    </html>
  );
}
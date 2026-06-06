import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "AI Constitution",
  description:
    "An open, community-developed draft constitution for AI — proposed, discussed, and moderated openly. Hosted by the American Society for AI.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-ink">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-rule">
          <div className="mx-auto max-w-4xl px-6 py-6 text-xs text-muted">
            American Society for AI — hosting an open, collaborative draft.
            Content reflects topics for discussion, not the official position of
            ASFAI.
          </div>
        </footer>
      </body>
    </html>
  );
}

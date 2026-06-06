import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ASFAI Constitution",
  description:
    "A community-developed constitution for AI — proposed, discussed, and moderated openly.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gray-50">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
            ASFAI Constitution — a community project. Content reflects topics for
            discussion, not the official position of ASFAI.
          </div>
        </footer>
      </body>
    </html>
  );
}

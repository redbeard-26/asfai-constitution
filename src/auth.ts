import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/env";

const providers: NextAuthConfig["providers"] = [];

// Google OAuth — only enabled when credentials are configured.
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

// Email magic link. We override sendVerificationRequest so:
//  - with AUTH_RESEND_KEY: the link is emailed via the Resend HTTP API,
//  - without it (dev): the link is printed to the server console.
// Because sendVerificationRequest is overridden, the `nodemailer` package is
// never imported at runtime and does not need to be installed.
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "AI Constitution <onboarding@resend.dev>";

function magicLinkEmailHtml(url: string): string {
  return `<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
  <div style="text-align:center; border-bottom: 4px solid #E0A93B; padding-bottom: 12px; margin-bottom: 20px;">
    <div style="font-variant: small-caps; letter-spacing: 0.06em; font-size: 20px; font-weight: bold;">American Society for AI</div>
    <div style="font-variant: small-caps; letter-spacing: 0.08em; font-size: 12px; color: #C8902A;">AI Constitution</div>
  </div>
  <p>Click the button below to sign in to the AI Constitution.</p>
  <p style="text-align:center; margin: 24px 0;">
    <a href="${url}" style="background:#C8902A; color:#ffffff; text-decoration:none; padding: 10px 22px; border-radius:4px; font-weight:bold;">Sign in</a>
  </p>
  <p style="font-size: 12px; color:#5c5c5c;">If you did not request this, you can safely ignore this email.</p>
</div>`;
}

providers.push(
  Nodemailer({
    server: { host: "localhost", port: 587 },
    from: EMAIL_FROM,
    async sendVerificationRequest({ identifier, url }) {
      const key = process.env.AUTH_RESEND_KEY;
      if (!key) {
        console.log("\n==================================================");
        console.log(`🔑  Magic sign-in link for ${identifier}:`);
        console.log(url);
        console.log("==================================================\n");
        return;
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: identifier,
          subject: "Sign in to the AI Constitution",
          html: magicLinkEmailHtml(url),
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to send magic link via Resend: ${await res.text()}`);
      }
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers,
  pages: { signIn: "/signin", verifyRequest: "/signin/verify" },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: string }).role ?? "VIEWER";
      }
      return session;
    },
  },
  events: {
    // Auto-promote configured admin emails on account creation and on sign-in.
    async createUser({ user }) {
      if (isAdminEmail(user.email) && user.id) {
        await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      }
    },
    async signIn({ user }) {
      if (isAdminEmail(user.email) && user.id) {
        const current = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        if (current && current.role !== "ADMIN") {
          await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
        }
      }
    },
  },
});

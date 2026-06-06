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
providers.push(
  Nodemailer({
    server: { host: "localhost", port: 587 },
    from: process.env.EMAIL_FROM ?? "ASFAI Constitution <onboarding@resend.dev>",
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
          from: process.env.EMAIL_FROM ?? "ASFAI Constitution <onboarding@resend.dev>",
          to: identifier,
          subject: "Sign in to the ASFAI Constitution",
          html: `<p>Click the link below to sign in to the ASFAI Constitution wiki:</p>
                 <p><a href="${url}">Sign in</a></p>
                 <p>If you did not request this, you can ignore this email.</p>`,
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

import { auth } from "@/auth";
import { isModerator, isAdmin } from "@/lib/constants";

export type SessionUser = {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/** Throws if not signed in. Use in server actions that require any account. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("You must be signed in to do that.");
  return user;
}

/** Throws if the current user is not a moderator or admin. */
export async function requireModerator(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isModerator(user.role)) throw new Error("Moderator access required.");
  return user;
}

/** Throws if the current user is not an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdmin(user.role)) throw new Error("Admin access required.");
  return user;
}

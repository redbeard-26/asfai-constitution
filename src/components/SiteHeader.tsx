import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getPendingProposalCount } from "@/lib/data";
import { isModerator, isAdmin } from "@/lib/constants";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const mod = isModerator(user?.role);
  const admin = isAdmin(user?.role);
  const pending = mod ? await getPendingProposalCount() : 0;

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">ASFAI</span>
          <span className="text-sm text-muted">Constitution</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-muted hover:text-foreground">
            Articles
          </Link>
          {mod && (
            <Link href="/moderation" className="text-muted hover:text-foreground">
              Moderation
              {pending > 0 && (
                <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-xs font-medium text-white">
                  {pending}
                </span>
              )}
            </Link>
          )}
          {admin && (
            <Link href="/admin/users" className="text-muted hover:text-foreground">
              Admin
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-muted sm:inline">
                {user.name ?? user.email}
              </span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-muted">
                {user.role}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-gray-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/signin"
              className="rounded bg-accent px-3 py-1.5 text-white hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

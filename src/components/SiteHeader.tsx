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
    <header className="border-b-4 border-gold bg-background">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link href="/" className="flex items-baseline">
          <span
            className="text-lg font-bold text-ink"
            style={{ fontVariant: "small-caps", letterSpacing: "0.06em" }}
          >
            American Society for AI
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="text-muted hover:text-ink">
            Articles
          </Link>
          <Link href="/candidates" className="text-muted hover:text-ink">
            Candidates
          </Link>
          <Link href="/docs" className="text-muted hover:text-ink">
            Resources
          </Link>
          <Link href="/connect" className="text-muted hover:text-ink">
            AI Connector
          </Link>
          {mod && (
            <Link href="/moderation" className="text-muted hover:text-ink">
              Moderation
              {pending > 0 && (
                <span className="ml-1 rounded-full bg-gold px-1.5 py-0.5 text-xs font-bold text-ink">
                  {pending}
                </span>
              )}
            </Link>
          )}
          {admin && (
            <Link href="/admin/users" className="text-muted hover:text-ink">
              Admin
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-muted sm:inline">
                {user.name ?? user.email}
              </span>
              <span
                className="rounded border border-panel-border bg-panel px-1.5 py-0.5 text-xs text-gold-deep"
                style={{ fontVariant: "small-caps", letterSpacing: "0.05em" }}
              >
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
                  className="rounded border border-rule px-2 py-1 text-xs hover:bg-panel"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/signin"
              className="rounded bg-gold-deep px-3 py-1.5 text-background hover:bg-gold"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

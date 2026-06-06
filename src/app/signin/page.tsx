import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">American Society for AI</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Sign in</h1>
      </div>
      <p className="mt-2 text-sm text-muted">
        Sign in to comment and propose edits to the AI Constitution.
      </p>

      <div className="mt-8 space-y-4 border border-rule bg-panel p-6">
        {googleEnabled && (
          <>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded border border-rule bg-background px-4 py-2 text-sm font-bold hover:bg-panel"
              >
                Continue with Google
              </button>
            </form>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-rule" />
              or
              <span className="h-px flex-1 bg-rule" />
            </div>
          </>
        )}

        <form
          action={async (formData: FormData) => {
            "use server";
            const email = String(formData.get("email"));
            await signIn("nodemailer", { email, redirectTo: "/" });
          }}
          className="space-y-2"
        >
          <label htmlFor="email" className="block text-sm font-bold text-ink">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full border border-rule bg-background p-2 text-sm focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded bg-gold-deep px-4 py-2 text-sm font-bold text-background hover:bg-gold"
          >
            Email me a sign-in link
          </button>
        </form>
      </div>
    </div>
  );
}

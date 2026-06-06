import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Sign in to comment and propose edits to the ASFAI Constitution.
      </p>

      <div className="mt-8 space-y-4 rounded-lg border border-border bg-white p-6">
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
                className="w-full rounded border border-border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Continue with Google
              </button>
            </form>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
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
          <label htmlFor="email" className="block text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-md border border-border p-2 text-sm focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Email me a sign-in link
          </button>
        </form>
      </div>
    </div>
  );
}

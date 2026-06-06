export default function VerifyRequestPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <p className="kicker text-xs">American Society for AI</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
        Check your email
      </h1>
      <hr className="gold-rule mx-auto mt-4 w-[60%]" />
      <p className="mt-5 text-sm text-ink">
        A sign-in link has been sent to your email address. Click the link to
        finish signing in.
      </p>
      <p className="mt-3 text-xs text-muted">
        (In development with no email provider configured, the link is printed
        to the server console instead.)
      </p>
    </div>
  );
}

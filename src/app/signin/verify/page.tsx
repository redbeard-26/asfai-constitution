export default function VerifyRequestPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
      <p className="mt-3 text-sm text-muted">
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

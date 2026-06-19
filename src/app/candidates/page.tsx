import Link from "next/link";
import { getCandidates } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { createCandidate } from "@/lib/actions";
import { VoteWidget } from "@/components/VoteWidget";

export default async function CandidatesPage() {
  const user = await getSessionUser();
  const candidates = await getCandidates(user?.id).catch(() => []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Proposals</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Candidate Theses
        </h1>
      </div>
      <p className="mt-2 text-sm text-muted">
        Proposed theses not yet adopted into an article. Vote to surface the
        strongest; moderators promote them into an article or remove them.
      </p>

      <div className="mt-6">
        {user ? (
          <details className="border border-rule bg-panel p-3">
            <summary className="cursor-pointer text-sm font-bold text-ink">
              Propose a candidate thesis
            </summary>
            <form action={createCandidate} className="mt-3 space-y-2">
              <input
                name="title"
                required
                maxLength={200}
                placeholder="Short title, e.g. 'Environmental Responsibility'"
                className="w-full border border-rule bg-background p-2 text-sm focus:border-gold focus:outline-none"
              />
              <textarea
                name="text"
                required
                rows={4}
                placeholder="The proposed thesis text…"
                className="w-full border border-rule bg-background p-2 text-sm focus:border-gold focus:outline-none"
              />
              <textarea
                name="caseFor"
                rows={3}
                maxLength={4000}
                placeholder="The case for including this (optional)"
                className="w-full border border-rule bg-background p-2 text-sm focus:border-gold focus:outline-none"
              />
              <textarea
                name="caseAgainst"
                rows={3}
                maxLength={4000}
                placeholder="The case for changing or excluding this (optional)"
                className="w-full border border-rule bg-background p-2 text-sm focus:border-gold focus:outline-none"
              />
              <button
                type="submit"
                className="rounded bg-gold-deep px-3 py-1.5 text-sm font-bold text-background hover:bg-gold"
              >
                Submit candidate
              </button>
            </form>
          </details>
        ) : (
          <p className="border border-rule bg-panel p-3 text-sm text-muted">
            <Link href="/signin" className="text-gold-deep hover:underline">
              Sign in
            </Link>{" "}
            to propose a candidate thesis or vote.
          </p>
        )}
      </div>

      {candidates.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No candidate theses yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {candidates.map((c) => (
            <li key={c.id} className="flex gap-4 border border-rule bg-background p-4">
              <VoteWidget
                pageId={c.id}
                score={c.score}
                userVote={c.userVote}
                canVote={user != null}
              />
              <div className="min-w-0">
                <Link
                  href={`/p/${c.slug}`}
                  className="font-bold text-ink hover:text-gold-deep"
                >
                  {c.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

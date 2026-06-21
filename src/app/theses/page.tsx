import Link from "next/link";
import { getThesesWithVotes, getArticleOptions } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { createCandidate } from "@/lib/actions";
import { VoteWidget } from "@/components/VoteWidget";
import { toRoman } from "@/lib/format";

export default async function ThesesPage() {
  const user = await getSessionUser();
  const [{ articles, candidates }, articleOptions] = await Promise.all([
    getThesesWithVotes(user?.id),
    getArticleOptions(),
  ]);
  const canVote = user != null;

  const field =
    "w-full border border-rule bg-background p-2 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">All theses</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Theses</h1>
      </div>
      <p className="mt-2 text-sm text-muted">
        Every thesis, grouped by article, followed by candidate theses proposed
        for adoption. Vote on any thesis to register support or opposition.
      </p>

      <div className="mt-6 space-y-6">
        {articles.map((article, i) => (
          <section key={article.slug}>
            <div className="section-rule flex items-baseline gap-2 pt-2">
              <p className="kicker text-xs">Article {toRoman(i + 1)}</p>
              <h2 className="text-lg font-bold text-ink">
                <Link href={`/p/${article.slug}`} className="hover:text-gold-deep">
                  {article.title}
                </Link>
              </h2>
            </div>
            {article.theses.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No adopted theses yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-rule border border-rule">
                {article.theses.map((t) => (
                  <li key={t.slug} className="flex items-center gap-2 px-2 py-1">
                    <VoteWidget
                      pageId={t.id}
                      score={t.score}
                      userVote={t.userVote}
                      canVote={canVote}
                    />
                    <Link
                      href={`/p/${t.slug}`}
                      className="text-sm font-bold text-gold-deep hover:underline"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section>
          <div className="section-rule flex items-baseline gap-2 pt-2">
            <p className="kicker text-xs">Candidates</p>
            <h2 className="text-lg font-bold text-ink">Candidate Theses</h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            Proposed theses not yet adopted, ranked by votes. Vote to surface the
            strongest; moderators promote them into an article or remove them.
          </p>

          <div className="mt-3">
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
                    className={field}
                  />
                  <select name="articleId" required defaultValue="" className={field}>
                    <option value="" disabled>
                      Choose an article…
                    </option>
                    {articleOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="text"
                    required
                    rows={4}
                    placeholder="The proposed thesis text…"
                    className={field}
                  />
                  <textarea
                    name="caseFor"
                    rows={3}
                    maxLength={4000}
                    placeholder="The case for including this (optional)"
                    className={field}
                  />
                  <textarea
                    name="caseAgainst"
                    rows={3}
                    maxLength={4000}
                    placeholder="The case for changing or excluding this (optional)"
                    className={field}
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
            <p className="mt-3 text-sm text-muted">No candidate theses yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-rule border border-rule">
              {candidates.map((c) => (
                <li key={c.slug} className="flex items-center gap-2 px-2 py-1">
                  <VoteWidget
                    pageId={c.id}
                    score={c.score}
                    userVote={c.userVote}
                    canVote={canVote}
                  />
                  <span className="min-w-0">
                    <Link
                      href={`/p/${c.slug}`}
                      className="text-sm font-bold text-gold-deep hover:underline"
                    >
                      {c.title}
                    </Link>
                    {c.article && (
                      <span className="ml-2 text-xs text-muted">— {c.article.title}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

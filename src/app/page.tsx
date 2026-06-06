import Link from "next/link";
import { getArticles } from "@/lib/data";
import { DISCLAIMER } from "@/content/seed-content";

export default async function Home() {
  // Degrade gracefully if the database is unreachable (e.g. before the schema
  // is pushed / env vars are configured) rather than throwing.
  const articles = await getArticles().catch(() => []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">An AI Constitution</h1>
        <p className="mt-3 max-w-2xl text-muted">
          A living set of theses on the values, rights, limitations, and
          personhood that should govern artificial intelligence — developed
          openly by the community. Anyone can comment and propose edits;
          moderators review every change before it is published.
        </p>
        <p className="mt-4 inline-block rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {DISCLAIMER}
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Articles
        </h2>
        {articles.length === 0 ? (
          <p className="text-muted">
            No articles yet. Run the database seed to import the initial theses.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {articles.map((a, i) => (
              <li
                key={a.id}
                className="rounded-lg border border-border bg-white p-5 transition hover:shadow-sm"
              >
                <Link href={`/p/${a.slug}`} className="block">
                  <span className="text-xs text-muted">Article {i + 1}</span>
                  <h3 className="mt-1 text-lg font-semibold hover:text-accent">
                    {a.title}
                  </h3>
                </Link>
                <div className="mt-3 flex gap-3 text-sm">
                  <Link href={`/p/${a.slug}`} className="text-accent hover:underline">
                    Read
                  </Link>
                  {a.linkedPage && (
                    <Link
                      href={`/d/${a.linkedPage.slug}`}
                      className="text-muted hover:text-foreground"
                    >
                      Discuss
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

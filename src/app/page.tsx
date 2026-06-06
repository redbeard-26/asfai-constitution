import Link from "next/link";
import { getArticles } from "@/lib/data";
import { DISCLAIMER } from "@/content/seed-content";

export default async function Home() {
  // Degrade gracefully if the database is unreachable (e.g. before the schema
  // is pushed / env vars are configured) rather than throwing.
  const articles = await getArticles().catch(() => []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-ink">
          AI Constitution
        </h1>
        <hr className="gold-rule mx-auto mt-4 w-[86%] max-w-md" />
        <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-ink">
          A living set of theses on the values, rights, limitations, and
          personhood that should govern artificial intelligence — developed
          openly by the community. Anyone may comment and propose edits.
        </p>
        <p className="mx-auto mt-6 max-w-2xl border-l-4 border-gold bg-panel px-4 py-3 text-left text-sm text-ink">
          {DISCLAIMER}
        </p>
      </section>

      <section>
        <div className="section-rule pt-3">
          <h2 className="kicker text-base">Articles</h2>
        </div>
        {articles.length === 0 ? (
          <p className="mt-4 text-muted">
            No articles yet. Run the database seed to import the initial theses.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {articles.map((a, i) => (
              <li
                key={a.id}
                className="border border-panel-border border-l-4 border-l-gold bg-panel p-5"
              >
                <Link href={`/p/${a.slug}`} className="block">
                  <span className="kicker text-xs">Issue {i + 1}</span>
                  <h3 className="mt-1 text-xl font-bold text-ink hover:text-gold-deep">
                    {a.title}
                  </h3>
                </Link>
                <div className="mt-3 flex gap-4 text-sm">
                  <Link
                    href={`/p/${a.slug}`}
                    className="text-gold-deep hover:underline"
                  >
                    Read
                  </Link>
                  {a.linkedPage && (
                    <Link
                      href={`/d/${a.linkedPage.slug}`}
                      className="text-muted hover:text-ink"
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

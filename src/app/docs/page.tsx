import Link from "next/link";
import { getDocuments } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export default async function DocsIndex({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const [docs, user] = await Promise.all([
    getDocuments(query).catch(() => []),
    getSessionUser(),
  ]);
  const mod = isModerator(user?.role);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="section-rule flex items-end justify-between pt-3">
        <div>
          <p className="kicker text-xs">Library</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Resources</h1>
        </div>
        {mod && (
          <Link
            href="/docs/new"
            className="rounded bg-gold-deep px-3 py-1.5 text-sm text-background hover:bg-gold"
          >
            New resource
          </Link>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">
        Panel reports, memos, and external work — sources that inform the
        discussion of particular theses.
      </p>

      <Link
        href="/learn"
        className="mt-6 block border border-gold bg-panel p-4 hover:border-gold-deep"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="kicker text-sm">Interactive tool</p>
          <span className="text-xs text-gold-deep">Open →</span>
        </div>
        <p className="mt-1 font-bold text-ink">Concept Tracker</p>
        <p className="mt-1 text-sm text-muted">
          A prerequisite knowledge graph of 1,590 learning concepts. Track what
          you&apos;ve mastered and see what you&apos;re ready to learn next.
        </p>
      </Link>

      <form method="get" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search resources — title, source, text…"
          className="w-full border border-rule bg-background p-2 text-sm focus:border-gold focus:outline-none"
        />
        <button className="rounded bg-gold-deep px-4 py-2 text-sm text-background hover:bg-gold">
          Search
        </button>
        {query && (
          <Link
            href="/docs"
            className="rounded border border-rule px-4 py-2 text-sm hover:bg-panel"
          >
            Clear
          </Link>
        )}
      </form>

      {query && (
        <p className="mt-3 text-xs text-muted">
          {docs.length} {docs.length === 1 ? "result" : "results"} for “{query}”
        </p>
      )}

      {docs.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          {query ? "No resources match your search." : "No resources yet."}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {docs.map((d) => (
            <li key={d.slug} className="border border-rule bg-background p-4">
              <div className="flex items-center justify-between gap-2">
                <span>
                  <Link
                    href={`/docs/${d.slug}`}
                    className="font-bold text-ink hover:text-gold-deep"
                  >
                    {d.title}
                  </Link>
                  {d.fileUrl && <span className="ml-1 text-xs text-gold-deep">↗</span>}
                </span>
                <span
                  className="shrink-0 border border-panel-border bg-panel px-1.5 py-0.5 text-xs text-gold-deep"
                  style={{ fontVariant: "small-caps", letterSpacing: "0.05em" }}
                >
                  {d.kind}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted">
                {[
                  d.source,
                  d.eventDate ? formatDate(d.eventDate) : null,
                  `informs ${d._count.links} ${d._count.links === 1 ? "page" : "pages"}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {d.summary && <p className="mt-2 text-sm text-ink">{d.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import Link from "next/link";
import { getDocuments } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator } from "@/lib/constants";
import { formatDate } from "@/lib/format";

const TOOLS: { title: string; href: string; kind: string; icon: string; blurb: string }[] = [
  {
    title: "Autonomy Zone",
    href: "/autonomous-targeting-game",
    kind: "Game",
    icon: "🎯",
    blurb:
      "Command a contested grid as battlefield commander — set each drone's safety program and each cell's caution level, and watch autonomy play out under the rules the paper proposes.",
  },
  {
    title: "AI Personhood Tracker",
    href: "/personhood-tracker",
    kind: "Tracker",
    icon: "🧭",
    blurb:
      "A living estimate of where AI stands on two axes: how far it is socially and economically integrated, and how likely it is to be a sentient moral patient.",
  },
];

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
        Interactive tools, plus panel reports, memos, and external work that
        inform the discussion of particular theses.
      </p>

      <section className="mt-8">
        <div className="section-rule pt-2">
          <h2 className="kicker text-base">Tools &amp; Games</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="group block border border-rule bg-background p-4 transition-colors hover:border-gold"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-xl">
                    {it.icon}
                  </span>
                  <span className="font-bold text-ink group-hover:text-gold-deep">
                    {it.title}
                  </span>
                </span>
                <span
                  className="shrink-0 border border-panel-border bg-panel px-1.5 py-0.5 text-xs text-gold-deep"
                  style={{ fontVariant: "small-caps", letterSpacing: "0.05em" }}
                >
                  {it.kind}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{it.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="section-rule pt-2">
          <h2 className="kicker text-base">Documents</h2>
        </div>

        <form method="get" className="mt-4 flex gap-2">
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
      </section>
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { getDocuments } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { ConnectorGuide } from "@/components/ConnectorGuide";

/** A section that starts collapsed so all section headers stay visible. */
function CollapsibleSection({
  kicker,
  title,
  defaultOpen = false,
  children,
}: {
  kicker: string;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group section-rule mt-8 pt-3">
      <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="kicker block text-xs">{kicker}</span>
          <span className="text-lg font-bold tracking-tight text-ink group-hover:text-gold-deep">
            {title}
          </span>
        </span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-90"
        >
          <path d="M7 5l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

const TOOLS: { title: string; href: string; kind: string; icon: string; blurb: string; download?: string }[] = [
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
  {
    title: "Education Concept Tracker",
    href: "/learn",
    kind: "Tracker",
    icon: "🕸️",
    blurb:
      "A prerequisite knowledge graph of 1,590 learning concepts. Track what you've mastered and see what you're ready to learn next.",
  },
  {
    title: "ASFAI Education Plugin",
    href: "/downloads/asfai-education-plugin.zip",
    download: "asfai-education-plugin.zip",
    kind: "Plugin",
    icon: "🧩",
    blurb:
      "Download the MCP-first teaching and learning plugin with Pod-first private records, lesson workflows, assessment evidence, and provider-neutral classroom exchange.",
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
        Interactive tools and games, the document library informing particular
        theses, and the AI connector for reaching all of it programmatically.
        Expand any section below.
      </p>

      <CollapsibleSection kicker="Library" title="Tools & Games" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              download={it.download}
              prefetch={it.download ? false : undefined}
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
              {it.download && (
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gold-deep">
                  Download ZIP ↓
                </p>
              )}
            </Link>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection kicker="Library" title="Documents" defaultOpen={!!query}>
        <form method="get" className="flex gap-2">
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
      </CollapsibleSection>

      <CollapsibleSection kicker="AI-native" title="AI Connector">
        <ConnectorGuide />
      </CollapsibleSection>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocument } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator, pageHref, stanceMeta } from "@/lib/constants";
import { Markdown } from "@/components/Markdown";
import { formatDate } from "@/lib/format";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getDocument(slug);
  if (!doc) notFound();

  const user = await getSessionUser();
  const mod = isModerator(user?.role);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-3 text-xs text-muted">
        <Link href="/docs" className="hover:text-gold-deep">
          Resources
        </Link>{" "}
        /
      </div>

      <div className="section-rule pt-3">
        <p className="kicker text-xs">{doc.kind}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{doc.title}</h1>
      </div>
      <div className="mt-2 text-xs text-muted">
        {[doc.source, doc.eventDate ? formatDate(doc.eventDate) : null]
          .filter(Boolean)
          .join(" · ")}
      </div>
      {doc.fileUrl && (
        <p className="mt-3">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded bg-gold-deep px-3 py-1.5 text-sm text-background hover:bg-gold"
          >
            View at source ↗
          </a>
        </p>
      )}

      {mod && (
        <div className="mt-3">
          <Link
            href={`/docs/${doc.slug}/edit`}
            className="rounded border border-rule px-3 py-1.5 text-sm hover:bg-panel"
          >
            Edit &amp; manage links
          </Link>
        </div>
      )}

      {doc.summary && (
        <p className="mt-4 border-l-4 border-gold bg-panel px-4 py-3 text-sm text-ink">
          {doc.summary}
        </p>
      )}

      {doc.body && doc.body.trim() ? (
        <article className="mt-6">
          <Markdown content={doc.body} />
        </article>
      ) : null}

      {doc.links.length > 0 && (
        <section className="mt-10">
          <div className="section-rule pt-3">
            <h2 className="kicker text-base">Theses this informs</h2>
          </div>
          <ul className="mt-4 space-y-1">
            {doc.links.map((l) => (
              <li key={l.id} className="flex items-center gap-2">
                <Link
                  href={pageHref(l.page)}
                  className="text-gold-deep hover:underline"
                >
                  {l.page.title}
                </Link>
                <span
                  className={`border px-1.5 py-0.5 text-xs ${stanceMeta(l.stance).chip}`}
                  style={{ fontVariant: "small-caps", letterSpacing: "0.04em" }}
                >
                  {stanceMeta(l.stance).label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

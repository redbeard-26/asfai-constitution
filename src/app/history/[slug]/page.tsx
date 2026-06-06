import Link from "next/link";
import { notFound } from "next/navigation";
import { getRevisions } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator, pageHref } from "@/lib/constants";
import { revertToRevision } from "@/lib/actions";
import { formatDateTime, displayName } from "@/lib/format";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getRevisions(slug);
  if (!data) notFound();

  const { page, revisions } = data;
  const user = await getSessionUser();
  const mod = isModerator(user?.role);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Revision history</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          {page.title}
        </h1>
      </div>
      <div className="mt-2 text-sm">
        <Link
          href={pageHref(page.category, page.slug)}
          className="text-gold-deep hover:underline"
        >
          ← Back to page
        </Link>
      </div>

      <ul className="mt-6 space-y-3">
        {revisions.map((rev) => {
          const isCurrent = rev.id === page.currentRevisionId;
          return (
            <li key={rev.id} className="border border-rule bg-background p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-bold text-ink">
                    {rev.summary || "(no summary)"}
                  </span>
                  {isCurrent && (
                    <span className="ml-2 border border-pro bg-pro-bg px-2 py-0.5 text-xs text-pro-head">
                      current
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted">
                  {formatDateTime(rev.createdAt)} · {displayName(rev.author)}
                </div>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted hover:text-gold-deep">
                  View content
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap border border-rule bg-panel p-3 font-mono text-xs">
                  {rev.content}
                </pre>
              </details>
              {mod && !isCurrent && (
                <form action={revertToRevision} className="mt-2">
                  <input type="hidden" name="revisionId" value={rev.id} />
                  <button className="text-xs text-gold-deep hover:underline">
                    Revert to this revision
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import Link from "next/link";
import { getPendingProposals, getPendingDocuments } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator, isAdmin, pageHref, PAGE_TYPE_LABEL, type PageType } from "@/lib/constants";
import { approveProposal, rejectProposal, approveDocument, deleteDocument } from "@/lib/actions";
import { Diff } from "@/components/Diff";
import { AdminUsersPanel } from "@/components/AdminUsersPanel";
import { formatDate, formatDateTime, displayName } from "@/lib/format";

export default async function ModerationPage() {
  const user = await getSessionUser();
  if (!isModerator(user?.role)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted">
        Moderator access required.
      </div>
    );
  }

  const [proposals, pendingDocs] = await Promise.all([
    getPendingProposals(),
    getPendingDocuments(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Moderation</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Review queue
        </h1>
      </div>
      <p className="mt-2 text-sm text-muted">
        {proposals.length} pending edit{proposals.length === 1 ? "" : "s"} awaiting
        review. Approving publishes the change as a new revision.
      </p>

      {/* New resources awaiting review */}
      <section className="mt-8">
        <div className="section-rule pt-3">
          <h2 className="kicker text-base">
            New resources{" "}
            {pendingDocs.length > 0 && (
              <span className="ml-1 rounded-full bg-gold px-1.5 py-0.5 text-xs font-bold text-ink">
                {pendingDocs.length}
              </span>
            )}
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted">
          Newly added resources are hidden from the public library and page
          panels until reviewed. Approve to publish, or reject to delete.
        </p>

        {pendingDocs.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No resources awaiting review.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pendingDocs.map((d) => (
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
                    formatDate(d.createdAt),
                    `${d._count.links} ${d._count.links === 1 ? "link" : "links"}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {d.summary && <p className="mt-2 text-sm text-ink">{d.summary}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <form action={approveDocument}>
                    <input type="hidden" name="documentId" value={d.id} />
                    <button className="rounded bg-pro-head px-3 py-1.5 text-sm font-bold text-background hover:bg-pro">
                      Approve &amp; publish
                    </button>
                  </form>
                  <Link
                    href={`/docs/${d.slug}/edit`}
                    className="rounded border border-rule px-3 py-1.5 text-sm hover:bg-panel"
                  >
                    Review &amp; edit
                  </Link>
                  <form action={deleteDocument}>
                    <input type="hidden" name="documentId" value={d.id} />
                    <button className="rounded border border-con px-3 py-1.5 text-sm font-bold text-con-head hover:bg-con-bg">
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="section-rule mt-10 pt-3">
        <h2 className="kicker text-base">Edit proposals</h2>
      </div>

      <ul className="mt-6 space-y-6">
        {proposals.map((p) => {
          const currentContent = p.page.currentRevision?.content ?? "";
          const isStale =
            p.baseRevisionId != null &&
            p.page.currentRevisionId != null &&
            p.baseRevisionId !== p.page.currentRevisionId;
          return (
            <li key={p.id} className="border border-rule bg-background p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Link
                    href={pageHref(p.page)}
                    className="font-bold text-ink hover:text-gold-deep"
                  >
                    {p.page.title}
                  </Link>
                  <span
                    className="ml-2 border border-panel-border bg-panel px-1.5 py-0.5 text-xs text-gold-deep"
                    style={{ fontVariant: "small-caps", letterSpacing: "0.05em" }}
                  >
                    {PAGE_TYPE_LABEL[p.page.type as PageType] ?? p.page.type}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {displayName(p.author)} · {formatDateTime(p.createdAt)}
                </div>
              </div>

              {p.summary && (
                <p className="mt-2 text-sm text-ink">
                  <span className="text-muted">Summary:</span> {p.summary}
                </p>
              )}

              {isStale && (
                <p className="mt-2 border-l-4 border-gold bg-panel px-3 py-2 text-xs text-ink">
                  This edit was written against an older revision. Review the
                  diff carefully — approving will overwrite the current version.
                </p>
              )}

              <div className="mt-3">
                <p className="kicker mb-1 text-xs">Changes vs. current version</p>
                <Diff oldText={currentContent} newText={p.proposedContent} />
              </div>

              <div className="mt-4 flex flex-wrap items-start gap-3">
                <form action={approveProposal}>
                  <input type="hidden" name="proposalId" value={p.id} />
                  <button className="rounded bg-pro-head px-3 py-1.5 text-sm font-bold text-background hover:bg-pro">
                    Approve &amp; publish
                  </button>
                </form>
                <form action={rejectProposal} className="flex items-center gap-2">
                  <input type="hidden" name="proposalId" value={p.id} />
                  <input
                    name="reviewNote"
                    placeholder="Reason (optional)"
                    className="border border-rule px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                  />
                  <button className="rounded border border-con px-3 py-1.5 text-sm font-bold text-con-head hover:bg-con-bg">
                    Reject
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      {proposals.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">
          Nothing to review right now.
        </p>
      )}

      {isAdmin(user?.role) && <AdminUsersPanel meId={user!.id} />}
    </div>
  );
}

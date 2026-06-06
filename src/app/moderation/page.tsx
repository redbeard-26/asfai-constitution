import Link from "next/link";
import { getPendingProposals } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator, pageHref } from "@/lib/constants";
import { approveProposal, rejectProposal } from "@/lib/actions";
import { Diff } from "@/components/Diff";
import { formatDateTime, displayName } from "@/lib/format";

export default async function ModerationPage() {
  const user = await getSessionUser();
  if (!isModerator(user?.role)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted">
        Moderator access required.
      </div>
    );
  }

  const proposals = await getPendingProposals();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Moderation queue</h1>
      <p className="mt-2 text-sm text-muted">
        {proposals.length} pending edit{proposals.length === 1 ? "" : "s"} awaiting
        review. Approving publishes the change as a new revision.
      </p>

      <ul className="mt-6 space-y-6">
        {proposals.map((p) => {
          const currentContent = p.page.currentRevision?.content ?? "";
          const isStale =
            p.baseRevisionId != null &&
            p.page.currentRevisionId != null &&
            p.baseRevisionId !== p.page.currentRevisionId;
          return (
            <li key={p.id} className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Link
                    href={pageHref(p.page.category, p.page.slug)}
                    className="font-medium hover:text-accent"
                  >
                    {p.page.title}
                  </Link>
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-muted">
                    {p.page.category === "DISCUSSION" ? "Discussion" : "Article"}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {displayName(p.author)} · {formatDateTime(p.createdAt)}
                </div>
              </div>

              {p.summary && (
                <p className="mt-2 text-sm">
                  <span className="text-muted">Summary:</span> {p.summary}
                </p>
              )}

              {isStale && (
                <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  ⚠ This edit was written against an older revision. Review the
                  diff carefully — approving will overwrite the current version.
                </p>
              )}

              <div className="mt-3">
                <div className="mb-1 text-xs font-medium text-muted">
                  Changes vs. current version
                </div>
                <Diff oldText={currentContent} newText={p.proposedContent} />
              </div>

              <div className="mt-4 flex flex-wrap items-start gap-3">
                <form action={approveProposal}>
                  <input type="hidden" name="proposalId" value={p.id} />
                  <button className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
                    Approve &amp; publish
                  </button>
                </form>
                <form action={rejectProposal} className="flex items-center gap-2">
                  <input type="hidden" name="proposalId" value={p.id} />
                  <input
                    name="reviewNote"
                    placeholder="Reason (optional)"
                    className="rounded border border-border px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
                  />
                  <button className="rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
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
          Nothing to review right now. 🎉
        </p>
      )}
    </div>
  );
}

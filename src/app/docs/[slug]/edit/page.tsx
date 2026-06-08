import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocument, getAllPagesForLink } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import {
  isModerator,
  pageHref,
  PAGE_TYPE_LABEL,
  STANCES,
  STANCE_META,
  type PageType,
} from "@/lib/constants";
import {
  updateDocument,
  deleteDocument,
  linkDocument,
  unlinkDocument,
  updateLink,
  approveDocument,
} from "@/lib/actions";
import { DocumentForm } from "@/components/DocumentForm";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!isModerator(user?.role)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted">
        Moderator access required.
      </div>
    );
  }

  const [doc, allPages] = await Promise.all([getDocument(slug), getAllPagesForLink()]);
  if (!doc) notFound();

  const linkedPageIds = new Set(doc.links.map((l) => l.page.slug));
  const unlinked = allPages.filter((p) => !linkedPageIds.has(p.slug));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-3 text-xs text-muted">
        <Link href={`/docs/${doc.slug}`} className="hover:text-gold-deep">
          {doc.title}
        </Link>{" "}
        /
      </div>
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Edit resource</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{doc.title}</h1>
      </div>

      {doc.relevance < 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-l-4 border-gold bg-panel px-4 py-3">
          <span className="text-sm text-ink">
            <strong>Pending review.</strong> Hidden from the public library and
            page panels until approved. Add links and a relevance below, then
            approve to publish.
          </span>
          <form action={approveDocument}>
            <input type="hidden" name="documentId" value={doc.id} />
            <button className="rounded bg-pro-head px-3 py-1.5 text-sm font-bold text-background hover:bg-pro">
              Approve &amp; publish
            </button>
          </form>
        </div>
      )}

      <div className="mt-6">
        <DocumentForm
          action={updateDocument}
          submitLabel="Save changes"
          defaults={{
            id: doc.id,
            title: doc.title,
            kind: doc.kind,
            source: doc.source ?? undefined,
            eventDate: doc.eventDate
              ? doc.eventDate.toISOString().slice(0, 10)
              : undefined,
            summary: doc.summary ?? undefined,
            body: doc.body ?? undefined,
            fileUrl: doc.fileUrl ?? undefined,
          }}
        />
      </div>

      {/* Link management */}
      <section className="mt-10">
        <div className="section-rule pt-3">
          <h2 className="kicker text-base">Linked theses &amp; articles</h2>
        </div>
        <p className="mt-1 text-xs text-muted">
          Relevance (0–1) is hidden from readers and orders a page&apos;s
          &ldquo;Related resources&rdquo; list; stance (Supports / Discusses /
          Challenges) is shown as a chip.
        </p>

        {doc.links.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Not linked to any page yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {doc.links.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2">
                <Link href={pageHref(l.page)} className="text-sm text-gold-deep hover:underline">
                  {l.page.title}{" "}
                  <span className="text-xs text-muted">
                    ({PAGE_TYPE_LABEL[l.page.type as PageType]})
                  </span>
                </Link>
                <div className="flex items-center gap-3">
                  <form action={updateLink} className="flex items-center gap-1">
                    <input type="hidden" name="linkId" value={l.id} />
                    <select
                      name="stance"
                      defaultValue={l.stance}
                      aria-label="Stance"
                      className="border border-rule px-1 py-0.5 text-xs"
                    >
                      {STANCES.map((s) => (
                        <option key={s} value={s}>
                          {STANCE_META[s].label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="relevance"
                      min="0"
                      max="1"
                      step="0.05"
                      defaultValue={l.relevance}
                      aria-label="Relevance"
                      className="w-16 border border-rule px-1 py-0.5 text-xs"
                    />
                    <button className="text-xs text-gold-deep hover:underline">Save</button>
                  </form>
                  <form action={unlinkDocument}>
                    <input type="hidden" name="linkId" value={l.id} />
                    <button className="text-xs text-con-head hover:underline">Remove</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={linkDocument} className="mt-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="documentId" value={doc.id} />
          <select name="pageId" required className="border border-rule px-2 py-1.5 text-sm">
            <option value="">Add a link…</option>
            {unlinked.map((p) => (
              <option key={p.id} value={p.id}>
                [{PAGE_TYPE_LABEL[p.type as PageType]}] {p.title}
              </option>
            ))}
          </select>
          <select
            name="stance"
            defaultValue="NEUTRAL"
            aria-label="Stance"
            className="border border-rule px-2 py-1.5 text-sm"
          >
            {STANCES.map((s) => (
              <option key={s} value={s}>
                {STANCE_META[s].label}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="relevance"
            min="0"
            max="1"
            step="0.05"
            defaultValue="0.5"
            aria-label="Relevance (0–1)"
            title="Relevance (0–1)"
            className="w-16 border border-rule px-2 py-1.5 text-sm"
          />
          <button className="rounded border border-rule px-3 py-1.5 text-sm hover:bg-panel">
            Link
          </button>
        </form>
      </section>

      <section className="mt-10 border-t border-rule pt-4">
        <form action={deleteDocument}>
          <input type="hidden" name="documentId" value={doc.id} />
          <button className="text-xs text-con-head hover:underline">
            Delete this document
          </button>
        </form>
      </section>
    </div>
  );
}

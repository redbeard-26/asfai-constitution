import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPage } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { pageHref } from "@/lib/constants";
import { EditProposalForm } from "@/components/EditProposalForm";

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/signin");

  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">
        Propose an edit
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{page.title}</h1>
      <p className="mt-2 text-sm text-muted">
        Edit the content below and submit it for review. Your change will not be
        published until a moderator approves it.
      </p>

      <div className="mt-6">
        <EditProposalForm
          pageId={page.id}
          baseRevisionId={page.currentRevisionId ?? null}
          initialContent={page.currentRevision?.content ?? ""}
        />
      </div>

      <div className="mt-4 text-sm">
        <Link
          href={pageHref(page.category, page.slug)}
          className="text-muted hover:text-foreground"
        >
          ← Cancel and return to page
        </Link>
      </div>
    </div>
  );
}

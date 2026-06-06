import Link from "next/link";
import { notFound } from "next/navigation";
import { getPage, getComments, pairedPage } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator, pageHref, type Category } from "@/lib/constants";
import { Markdown } from "@/components/Markdown";
import { Comments } from "@/components/Comments";
import { formatDateTime, displayName } from "@/lib/format";

export async function PageScreen({
  slug,
  category,
  proposed,
}: {
  slug: string;
  category: Category;
  proposed?: boolean;
}) {
  const page = await getPage(slug);
  if (!page || page.category !== category) notFound();

  const user = await getSessionUser();
  const comments = await getComments(page.id);
  const paired = pairedPage(page);
  const viewPath = pageHref(category, slug);
  const isDiscussion = category === "DISCUSSION";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {proposed && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Thanks! Your edit was submitted and is awaiting moderator review.
          Nothing on this page changes until a moderator approves it.
        </div>
      )}

      <div className="text-xs font-semibold uppercase tracking-wide text-muted">
        {isDiscussion ? "Discussion" : "Article"}
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{page.title}</h1>
      <div className="mt-1 text-xs text-muted">
        {page.currentRevision ? (
          <>
            Updated {formatDateTime(page.currentRevision.createdAt)}
            {page.currentRevision.author
              ? ` · ${displayName(page.currentRevision.author)}`
              : ""}
          </>
        ) : (
          "No content yet"
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {user ? (
          <Link
            href={`/edit/${slug}`}
            className="rounded bg-accent px-3 py-1.5 text-white hover:opacity-90"
          >
            Propose edit
          </Link>
        ) : (
          <Link
            href="/signin"
            className="rounded border border-border px-3 py-1.5 hover:bg-gray-50"
          >
            Sign in to propose an edit
          </Link>
        )}
        <Link
          href={`/history/${slug}`}
          className="rounded border border-border px-3 py-1.5 hover:bg-gray-50"
        >
          History
        </Link>
        {paired && (
          <Link
            href={pageHref(paired.category, paired.slug)}
            className="rounded border border-border px-3 py-1.5 hover:bg-gray-50"
          >
            {paired.category === "DISCUSSION" ? "Discuss" : "Back to article"}
          </Link>
        )}
      </div>

      <article className="mt-6 rounded-lg border border-border bg-white p-6">
        {page.currentRevision ? (
          <Markdown content={page.currentRevision.content} />
        ) : (
          <p className="text-muted">This page has no content yet.</p>
        )}
      </article>

      <Comments
        pageId={page.id}
        path={viewPath}
        comments={comments}
        currentUserId={user?.id ?? null}
        isModerator={isModerator(user?.role)}
      />
    </div>
  );
}

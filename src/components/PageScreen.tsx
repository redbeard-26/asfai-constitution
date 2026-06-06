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
    <div className="mx-auto max-w-3xl px-6 py-10">
      {proposed && (
        <div className="mb-6 border-l-4 border-pro bg-pro-bg px-4 py-3 text-sm text-pro-head">
          Thank you. Your edit was submitted and is awaiting moderator review.
          Nothing on this page changes until a moderator approves it.
        </div>
      )}

      <div className="section-rule pt-3">
        <p className="kicker text-xs">{isDiscussion ? "Discussion" : "Article"}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          {page.title}
        </h1>
      </div>
      <div className="mt-2 text-xs text-muted">
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
            className="rounded bg-gold-deep px-3 py-1.5 text-background hover:bg-gold"
          >
            Propose edit
          </Link>
        ) : (
          <Link
            href="/signin"
            className="rounded border border-rule px-3 py-1.5 hover:bg-panel"
          >
            Sign in to propose an edit
          </Link>
        )}
        <Link
          href={`/history/${slug}`}
          className="rounded border border-rule px-3 py-1.5 hover:bg-panel"
        >
          History
        </Link>
        {paired && (
          <Link
            href={pageHref(paired.category, paired.slug)}
            className="rounded border border-rule px-3 py-1.5 hover:bg-panel"
          >
            {paired.category === "DISCUSSION" ? "Discuss" : "Back to article"}
          </Link>
        )}
      </div>

      <article className="mt-6 border-l-4 border-gold bg-panel px-6 py-5">
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

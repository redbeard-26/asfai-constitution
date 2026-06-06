import Link from "next/link";
import { Markdown } from "@/components/Markdown";
import { Comments, type CommentData } from "@/components/Comments";
import { formatDateTime, displayName } from "@/lib/format";
import { pageHref, PAGE_TYPE_LABEL, type PageType } from "@/lib/constants";

type Crumb = { slug: string; title: string; type: string };
type Child = { slug: string; title: string; type: string };

export function PageView({
  pageId,
  slug,
  type,
  title,
  content,
  updatedAt,
  authorName,
  breadcrumb,
  childPages,
  comments,
  currentUserId,
  isModerator,
  proposed,
}: {
  pageId: string;
  slug: string;
  type: string;
  title: string;
  content: string | null;
  updatedAt?: Date | null;
  authorName?: string | null;
  breadcrumb: Crumb[];
  childPages: Child[];
  comments: CommentData[];
  currentUserId: string | null;
  isModerator: boolean;
  proposed?: boolean;
}) {
  const path = pageHref({ slug, type });
  const childType = childPages[0]?.type;
  const childHeading =
    childType === "ARTICLE" ? "Articles" : childType === "THESIS" ? "Theses" : null;
  const kicker = PAGE_TYPE_LABEL[type as PageType] ?? "Page";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {proposed && (
        <div className="mb-6 border-l-4 border-pro bg-pro-bg px-4 py-3 text-sm text-pro-head">
          Thank you. Your edit was submitted and is awaiting moderator review.
          Nothing on this page changes until a moderator approves it.
        </div>
      )}

      {breadcrumb.length > 0 && (
        <nav className="mb-3 text-xs text-muted">
          {breadcrumb.map((c, i) => (
            <span key={c.slug}>
              <Link href={pageHref(c)} className="hover:text-gold-deep">
                {c.title}
              </Link>
              {i < breadcrumb.length - 1 ? " / " : " / "}
            </span>
          ))}
        </nav>
      )}

      <div className="section-rule pt-3">
        <p className="kicker text-xs">{kicker}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{title}</h1>
      </div>
      <div className="mt-2 text-xs text-muted">
        {updatedAt ? (
          <>
            Updated {formatDateTime(updatedAt)}
            {authorName ? ` · ${authorName}` : ""}
          </>
        ) : (
          "No content yet"
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {currentUserId ? (
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
      </div>

      {content && content.trim() ? (
        <article className="mt-6 border-l-4 border-gold bg-panel px-6 py-5">
          <Markdown content={content} />
        </article>
      ) : null}

      {childHeading && (
        <section className="mt-8">
          <div className="section-rule pt-3">
            <h2 className="kicker text-base">{childHeading}</h2>
          </div>
          {childType === "ARTICLE" ? (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {childPages.map((c, i) => (
                <li
                  key={c.slug}
                  className="border border-panel-border border-l-4 border-l-gold bg-panel p-5"
                >
                  <Link href={pageHref(c)} className="block">
                    <span className="kicker text-xs">Article {i + 1}</span>
                    <h3 className="mt-1 text-xl font-bold text-ink hover:text-gold-deep">
                      {c.title}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ol className="mt-4 space-y-2">
              {childPages.map((c, i) => (
                <li key={c.slug} className="flex gap-3">
                  <span className="text-muted">{i + 1}.</span>
                  <Link
                    href={pageHref(c)}
                    className="font-bold text-gold-deep hover:underline"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <Comments
        pageId={pageId}
        path={path}
        comments={comments}
        currentUserId={currentUserId}
        isModerator={isModerator}
      />
    </div>
  );
}

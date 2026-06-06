import Link from "next/link";
import { Markdown } from "@/components/Markdown";
import { Sidebar } from "@/components/Sidebar";
import { Comments, type CommentData } from "@/components/Comments";
import { formatDateTime, formatDate, displayName } from "@/lib/format";
import { pageHref, PAGE_TYPE_LABEL, stanceMeta, type PageType } from "@/lib/constants";

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
  relatedDocuments = [],
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
  relatedDocuments?: {
    slug: string;
    title: string;
    kind: string;
    source: string | null;
    fileUrl: string | null;
    eventDate: Date | null;
    stance: string;
  }[];
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
    <div className="mx-auto flex max-w-6xl gap-8 px-6 py-10">
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-2">
          <Sidebar activeSlug={slug} />
        </div>
      </aside>

      <div className="min-w-0 max-w-3xl flex-1">
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

      {relatedDocuments.length > 0 && (
        <details open className="section-rule mt-10 pt-3">
          <summary className="kicker cursor-pointer text-base">
            Related resources
          </summary>
          <ul className="mt-4 space-y-2">
            {relatedDocuments.map((d) => (
              <li key={d.slug} className="border border-rule border-l-4 border-l-gold bg-panel p-3">
                <div className="flex items-start justify-between gap-2">
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
                    className={`shrink-0 border px-1.5 py-0.5 text-xs ${stanceMeta(d.stance).chip}`}
                    style={{ fontVariant: "small-caps", letterSpacing: "0.04em" }}
                  >
                    {stanceMeta(d.stance).label}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {[d.source, d.kind, d.eventDate ? formatDate(d.eventDate) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
      </div>
    </div>
  );
}

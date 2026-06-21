import Link from "next/link";
import { Markdown } from "@/components/Markdown";
import { Sidebar } from "@/components/Sidebar";
import { Comments, type CommentData } from "@/components/Comments";
import { VoteWidget } from "@/components/VoteWidget";
import { promoteCandidate, demoteThesis } from "@/lib/actions";
import { formatDate, toRoman } from "@/lib/format";
import { pageHref, PAGE_TYPE_LABEL, stanceMeta, type PageType } from "@/lib/constants";

type Crumb = { slug: string; title: string; type: string };
type Child = { slug: string; title: string; type: string };

export function PageView({
  pageId,
  slug,
  type,
  title,
  content,
  breadcrumb,
  childPages,
  relatedDocuments = [],
  comments,
  commentOrder = "asc",
  currentUserId,
  isModerator,
  proposed,
  vote,
  articleOptions = [],
  caseFor,
  caseAgainst,
  prevPage,
  nextPage,
}: {
  pageId: string;
  slug: string;
  type: string;
  title: string;
  content: string | null;
  caseFor?: string | null;
  caseAgainst?: string | null;
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
  commentOrder?: "asc" | "desc";
  currentUserId: string | null;
  isModerator: boolean;
  proposed?: boolean;
  vote?: { score: number; userVote: number } | null;
  articleOptions?: { id: string; slug: string; title: string }[];
  prevPage?: { slug: string; title: string; type: string } | null;
  nextPage?: { slug: string; title: string; type: string } | null;
}) {
  const path = pageHref({ slug, type });
  const childType = childPages[0]?.type;
  const childHeading =
    childType === "ARTICLE" ? "Articles" : childType === "THESIS" ? "Theses" : null;
  const kicker = PAGE_TYPE_LABEL[type as PageType] ?? "Page";
  const votable = type === "THESIS" || type === "CANDIDATE";

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10">
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

      {type === "CANDIDATE" ? (
        <nav className="mb-3 text-xs text-muted">
          <Link href="/theses" className="hover:text-gold-deep">
            Theses
          </Link>{" "}
          /{" "}
          {breadcrumb.length > 0 && (
            <Link
              href={pageHref(breadcrumb[breadcrumb.length - 1])}
              className="hover:text-gold-deep"
            >
              {breadcrumb[breadcrumb.length - 1].title}
            </Link>
          )}
        </nav>
      ) : breadcrumb.length > 0 ? (
        <nav className="mb-3 text-xs text-muted">
          {breadcrumb.map((c) => (
            <span key={c.slug}>
              <Link href={pageHref(c)} className="hover:text-gold-deep">
                {c.title}
              </Link>{" "}
              /{" "}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="section-rule flex items-start gap-4 pt-3">
        {votable && vote && (
          <div className="pt-1">
            <VoteWidget
              pageId={pageId}
              score={vote.score}
              userVote={vote.userVote}
              canVote={currentUserId != null}
            />
          </div>
        )}
        <div className="min-w-0">
          {type !== "CONSTITUTION" && <p className="kicker text-xs">{kicker}</p>}
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{title}</h1>
        </div>
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

      {type === "CANDIDATE" && isModerator && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border border-rule bg-panel p-3 text-sm">
          <span className="text-muted">Moderator:</span>
          <form action={promoteCandidate} className="flex items-center gap-2">
            <input type="hidden" name="pageId" value={pageId} />
            <select name="articleId" required className="border border-rule px-2 py-1 text-sm">
              <option value="">Promote to article…</option>
              {articleOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
            <button className="rounded bg-pro-head px-3 py-1 text-background hover:bg-pro">
              Promote
            </button>
          </form>
        </div>
      )}

      {type === "THESIS" && isModerator && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border border-rule bg-panel p-3 text-sm">
          <span className="text-muted">Moderator:</span>
          <form action={demoteThesis}>
            <input type="hidden" name="pageId" value={pageId} />
            <button className="rounded border border-con px-3 py-1 text-con-head hover:bg-con-bg">
              Demote to candidate
            </button>
          </form>
        </div>
      )}

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
                    <span className="kicker text-xs">Article {toRoman(i + 1)}</span>
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

      {(caseFor || caseAgainst) && (
        <section className="mt-10">
          <div className="section-rule pt-3">
            <h2 className="kicker text-base">Summary</h2>
          </div>
          {caseFor && (
            <div className="mt-4 border-l-4 border-pro bg-pro-bg px-4 py-3">
              <p className="kicker text-xs">The case for including this</p>
              <p className="mt-1 text-sm leading-relaxed text-ink">{caseFor}</p>
            </div>
          )}
          {caseAgainst && (
            <div className="mt-3 border-l-4 border-con bg-con-bg px-4 py-3">
              <p className="kicker text-xs">The case for changing or excluding this</p>
              <p className="mt-1 text-sm leading-relaxed text-ink">{caseAgainst}</p>
            </div>
          )}
        </section>
      )}

      <Comments
        pageId={pageId}
        path={path}
        comments={comments}
        order={commentOrder}
        currentUserId={currentUserId}
        isModerator={isModerator}
      />

      {relatedDocuments.length > 0 && (
        <details open className="section-rule mt-10 pt-3">
          <summary className="kicker cursor-pointer text-base">
            Related resources
          </summary>
          <ul className="mt-4 space-y-2">
            {relatedDocuments.map((d) => {
              // The constitution as a whole is too broad for a meaningful
              // pro/con stance, so every resource here reads as "Discusses".
              const stance = stanceMeta(type === "CONSTITUTION" ? "NEUTRAL" : d.stance);
              return (
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
                    className={`shrink-0 border px-1.5 py-0.5 text-xs ${stance.chip}`}
                    style={{ fontVariant: "small-caps", letterSpacing: "0.04em" }}
                  >
                    {stance.label}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {[d.source, d.kind, d.eventDate ? formatDate(d.eventDate) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </li>
              );
            })}
          </ul>
        </details>
      )}

      {votable && (prevPage || nextPage) && (
        <nav className="section-rule mt-10 flex items-stretch justify-between gap-3 pt-4 text-sm">
          {prevPage ? (
            <Link
              href={pageHref(prevPage)}
              className="group flex max-w-[48%] flex-col border border-rule p-3 hover:bg-panel"
            >
              <span className="kicker text-xs text-muted">← Previous</span>
              <span className="mt-1 font-bold text-ink group-hover:text-gold-deep">
                {prevPage.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {nextPage ? (
            <Link
              href={pageHref(nextPage)}
              className="group flex max-w-[48%] flex-col items-end border border-rule p-3 text-right hover:bg-panel"
            >
              <span className="kicker text-xs text-muted">Next →</span>
              <span className="mt-1 font-bold text-ink group-hover:text-gold-deep">
                {nextPage.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
      </div>
    </div>
  );
}

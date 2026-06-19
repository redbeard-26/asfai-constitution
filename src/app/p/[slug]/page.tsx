import { notFound, redirect } from "next/navigation";
import {
  getPage,
  getComments,
  getDocumentsForPage,
  getVoteData,
  getArticleOptions,
  getThesisNeighbors,
} from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator } from "@/lib/constants";
import { displayName } from "@/lib/format";
import { PageView } from "@/components/PageView";

export default async function PageRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ proposed?: string; comments?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = await getPage(slug);
  if (!page) notFound();
  if (page.type === "CONSTITUTION") redirect("/articles");

  const user = await getSessionUser();
  const votable = page.type === "THESIS" || page.type === "CANDIDATE";
  const commentOrder = sp?.comments === "desc" ? "desc" : "asc";
  const [comments, relatedDocuments, vote, articleOptions, neighbors] =
    await Promise.all([
      getComments(page.id, commentOrder),
      getDocumentsForPage(page.id),
      votable ? getVoteData(page.id, user?.id) : Promise.resolve(null),
      page.type === "CANDIDATE" ? getArticleOptions() : Promise.resolve([]),
      votable ? getThesisNeighbors(page.slug) : Promise.resolve({ prev: null, next: null }),
    ]);

  const breadcrumb: { slug: string; title: string; type: string }[] = [];
  if (page.parent?.parent) breadcrumb.push(page.parent.parent);
  if (page.parent) {
    breadcrumb.push({
      slug: page.parent.slug,
      title: page.parent.title,
      type: page.parent.type,
    });
  }

  return (
    <PageView
      pageId={page.id}
      slug={page.slug}
      type={page.type}
      title={page.title}
      content={page.currentRevision?.content ?? null}
      updatedAt={page.currentRevision?.createdAt ?? null}
      authorName={
        page.currentRevision?.author
          ? displayName(page.currentRevision.author)
          : null
      }
      breadcrumb={breadcrumb}
      childPages={page.children}
      relatedDocuments={relatedDocuments}
      comments={comments}
      commentOrder={commentOrder}
      currentUserId={user?.id ?? null}
      isModerator={isModerator(user?.role)}
      proposed={sp?.proposed === "1"}
      vote={vote}
      articleOptions={articleOptions}
      caseFor={page.caseFor}
      caseAgainst={page.caseAgainst}
      prevPage={neighbors.prev}
      nextPage={neighbors.next}
    />
  );
}

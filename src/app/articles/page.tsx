import { getConstitution, getComments, getDocumentsForPage } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator } from "@/lib/constants";
import { displayName } from "@/lib/format";
import { PageView } from "@/components/PageView";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ proposed?: string; comments?: string }>;
}) {
  const sp = await searchParams;
  const page = await getConstitution().catch(() => null);

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted">
        Not seeded yet. Run the database seed to import the AI Constitution.
      </div>
    );
  }

  const commentOrder = sp?.comments === "desc" ? "desc" : "asc";
  const [user, comments, relatedDocuments] = await Promise.all([
    getSessionUser(),
    getComments(page.id, commentOrder),
    getDocumentsForPage(page.id),
  ]);

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
      breadcrumb={[]}
      childPages={page.children}
      relatedDocuments={relatedDocuments}
      comments={comments}
      commentOrder={commentOrder}
      currentUserId={user?.id ?? null}
      isModerator={isModerator(user?.role)}
      proposed={sp?.proposed === "1"}
    />
  );
}

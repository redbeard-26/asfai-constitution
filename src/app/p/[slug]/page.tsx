import { notFound, redirect } from "next/navigation";
import { getPage, getComments } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isModerator } from "@/lib/constants";
import { displayName } from "@/lib/format";
import { PageView } from "@/components/PageView";

export default async function PageRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ proposed?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = await getPage(slug);
  if (!page) notFound();
  if (page.type === "CONSTITUTION") redirect("/");

  const [user, comments] = await Promise.all([
    getSessionUser(),
    getComments(page.id),
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
      comments={comments}
      currentUserId={user?.id ?? null}
      isModerator={isModerator(user?.role)}
      proposed={sp?.proposed === "1"}
    />
  );
}

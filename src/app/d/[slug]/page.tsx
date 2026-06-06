import { PageScreen } from "@/components/PageScreen";

export default async function DiscussionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ proposed?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  return (
    <PageScreen slug={slug} category="DISCUSSION" proposed={sp?.proposed === "1"} />
  );
}

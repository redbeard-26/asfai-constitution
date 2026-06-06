import { PageScreen } from "@/components/PageScreen";

export default async function PresentationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ proposed?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  return (
    <PageScreen slug={slug} category="PRESENTATION" proposed={sp?.proposed === "1"} />
  );
}

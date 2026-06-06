import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { CONSTITUTION, ARTICLES } from "../src/content/seed-content";
import { SEED_DOCUMENTS } from "../src/content/documents";
import { EXTERNAL_RESOURCES } from "../src/content/external-resources";
import { adminEmails } from "../src/lib/env";

async function createPage(opts: {
  slug: string;
  title: string;
  type: "CONSTITUTION" | "ARTICLE" | "THESIS";
  parentId: string | null;
  sortOrder: number;
  content: string;
}) {
  const existing = await prisma.page.findUnique({ where: { slug: opts.slug } });
  if (existing) {
    console.log(`= ${opts.slug} exists — skipping`);
    return existing;
  }
  const page = await prisma.page.create({
    data: {
      slug: opts.slug,
      title: opts.title,
      type: opts.type,
      parentId: opts.parentId,
      sortOrder: opts.sortOrder,
    },
  });
  const rev = await prisma.revision.create({
    data: {
      pageId: page.id,
      content: opts.content,
      summary: "Initial import from ASFAI AI Theses",
    },
  });
  await prisma.page.update({
    where: { id: page.id },
    data: { currentRevisionId: rev.id },
  });
  return page;
}

async function main() {
  const constitution = await createPage({
    slug: CONSTITUTION.slug,
    title: CONSTITUTION.title,
    type: "CONSTITUTION",
    parentId: null,
    sortOrder: 0,
    content: CONSTITUTION.body,
  });
  console.log(`+ constitution: ${constitution.slug}`);

  for (const [ai, article] of ARTICLES.entries()) {
    const articlePage = await createPage({
      slug: article.slug,
      title: article.title,
      type: "ARTICLE",
      parentId: constitution.id,
      sortOrder: ai + 1,
      content: article.intro,
    });
    console.log(`  + article: ${article.slug} (${article.theses.length} theses)`);

    for (const [ti, thesis] of article.theses.entries()) {
      await createPage({
        slug: thesis.slug,
        title: thesis.title,
        type: "THESIS",
        parentId: articlePage.id,
        sortOrder: ti + 1,
        content: thesis.text,
      });
    }
  }

  for (const doc of [...SEED_DOCUMENTS, ...EXTERNAL_RESOURCES]) {
    const data = {
      title: doc.title,
      kind: doc.kind,
      source: doc.source ?? null,
      eventDate: doc.eventDate ? new Date(doc.eventDate) : null,
      summary: doc.summary,
      body: doc.body ?? null,
      fileUrl: doc.fileUrl ?? null,
    };
    const document = await prisma.document.upsert({
      where: { slug: doc.slug },
      update: data,
      create: { slug: doc.slug, ...data },
    });
    let linked = 0;
    for (const lnk of doc.links) {
      const page = await prisma.page.findUnique({
        where: { slug: lnk.slug },
        select: { id: true },
      });
      if (!page) {
        console.log(`  ! link target not found: ${lnk.slug}`);
        continue;
      }
      await prisma.documentLink.upsert({
        where: { documentId_pageId: { documentId: document.id, pageId: page.id } },
        update: { relevance: lnk.relevance },
        create: { documentId: document.id, pageId: page.id, relevance: lnk.relevance },
      });
      linked++;
    }
    console.log(`~ document: ${doc.slug} (${linked} links)`);
  }

  for (const email of adminEmails) {
    await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN" },
      create: { email, role: "ADMIN" },
    });
    console.log(`admin: ${email}`);
  }

  console.log("Seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

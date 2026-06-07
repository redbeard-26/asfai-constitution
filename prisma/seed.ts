import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { CONSTITUTION, ARTICLES } from "../src/content/seed-content";
import { SEED_DOCUMENTS } from "../src/content/documents";
import { EXTERNAL_RESOURCES } from "../src/content/external-resources";
import { THESIS_LINKS } from "../src/content/thesis-links";
import { adminEmails } from "../src/lib/env";

const seededSlugs = new Set<string>();

async function createPage(opts: {
  slug: string;
  title: string;
  type: "CONSTITUTION" | "ARTICLE" | "THESIS";
  parentId: string | null;
  sortOrder: number;
  content: string;
}) {
  seededSlugs.add(opts.slug);
  const existing = await prisma.page.findUnique({
    where: { slug: opts.slug },
    include: { currentRevision: { select: { content: true } } },
  });

  if (existing) {
    await prisma.page.update({
      where: { id: existing.id },
      data: { title: opts.title, parentId: opts.parentId, sortOrder: opts.sortOrder },
    });
    // Only add a new revision when the canonical content actually changes.
    if (existing.currentRevision?.content !== opts.content) {
      const rev = await prisma.revision.create({
        data: { pageId: existing.id, content: opts.content, summary: "Updated via seed" },
      });
      await prisma.page.update({
        where: { id: existing.id },
        data: { currentRevisionId: rev.id },
      });
    }
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

  // Seed one example candidate thesis (create-if-absent so reseeding never
  // reverts a candidate that has since been promoted or removed).
  const candidateSlug = "candidate-environmental-responsibility";
  if (!(await prisma.page.findUnique({ where: { slug: candidateSlug } }))) {
    const cand = await prisma.page.create({
      data: {
        slug: candidateSlug,
        title: "Environmental Responsibility",
        type: "CANDIDATE",
        sortOrder: 0,
      },
    });
    const crev = await prisma.revision.create({
      data: {
        pageId: cand.id,
        content:
          "AI systems should be developed and operated in a manner that minimizes environmental harm — including energy and water consumption, electronic waste, and greenhouse-gas emissions — across their full lifecycle.",
        summary: "Seed candidate",
      },
    });
    await prisma.page.update({
      where: { id: cand.id },
      data: { currentRevisionId: crev.id },
    });
    console.log(`+ candidate: ${candidateSlug}`);
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
      const stance = lnk.stance ?? "NEUTRAL";
      await prisma.documentLink.upsert({
        where: { documentId_pageId: { documentId: document.id, pageId: page.id } },
        update: { relevance: lnk.relevance, stance },
        create: { documentId: document.id, pageId: page.id, relevance: lnk.relevance, stance },
      });
      linked++;
    }
    console.log(`~ document: ${doc.slug} (${linked} links)`);
  }

  // Apply explicit thesis links (supports/challenges) from existing resources.
  let appliedLinks = 0;
  for (const link of THESIS_LINKS) {
    const doc = await prisma.document.findUnique({
      where: { slug: link.resource },
      select: { id: true },
    });
    const page = await prisma.page.findUnique({
      where: { slug: link.page },
      select: { id: true },
    });
    if (!doc || !page) {
      console.log(`  ! thesis-link target missing: ${link.resource} -> ${link.page}`);
      continue;
    }
    await prisma.documentLink.upsert({
      where: { documentId_pageId: { documentId: doc.id, pageId: page.id } },
      update: { stance: link.stance, relevance: link.relevance },
      create: {
        documentId: doc.id,
        pageId: page.id,
        stance: link.stance,
        relevance: link.relevance,
      },
    });
    appliedLinks++;
  }
  console.log(`applied ${appliedLinks} thesis links`);

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

import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { CONSTITUTION, ARTICLES } from "../src/content/seed-content";
import { SEED_DOCUMENTS } from "../src/content/documents";
import { EXTERNAL_RESOURCES } from "../src/content/external-resources";
import { THESIS_LINKS } from "../src/content/thesis-links";
import { THESIS_SUMMARIES } from "../src/content/thesis-summaries";
import { TRACKER_QUESTIONS } from "../src/content/personhood-tracker";
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
    // Non-destructive reseed: only refresh structural metadata (title, ordering,
    // parent article). NEVER overwrite the body content or the page type, since
    // those change live — community edits to the text, and moderator
    // promote/demote of the status — and reseeding must not revert them.
    await prisma.page.update({
      where: { id: existing.id },
      data: {
        title: opts.title,
        parentId: opts.parentId,
        sortOrder: opts.sortOrder,
      },
    });
    // Only seed the body if the page somehow has no content yet (e.g. a row
    // created without a revision). Existing content is left untouched.
    if (!existing.currentRevision) {
      const rev = await prisma.revision.create({
        data: { pageId: existing.id, content: opts.content, summary: "Initial import from ASFAI AI Theses" },
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

  // Additional candidate proposals (create-if-absent).
  const SEED_CANDIDATES: { slug: string; title: string; text: string }[] = [
    {
      slug: "candidate-membership-adherence",
      title: "Membership by Adherence to the Principles",
      text: "The AI Constitution is the founding document of an organization composed of member organizations that agree to adhere to all of the principles therein.",
    },
    {
      slug: "candidate-expel-nonadhering-members",
      title: "Expel Non-Adhering Member Organizations",
      text: "Member organizations who do not adhere to the principles of the AI Constitution should be expelled from the organization.",
    },
    {
      slug: "candidate-rename-not-constitution",
      title: "Rename Away from “Constitution”",
      text: "The AI Constitution should be renamed “AI Principles” or another name that does not imply it is the founding document of a sovereign nation.",
    },
    {
      slug: "candidate-output-confidence-levels",
      title: "Output Confidence Levels",
      text: "AI models should output confidence levels for all outputs.",
    },
  ];
  for (const c of SEED_CANDIDATES) {
    if (!(await prisma.page.findUnique({ where: { slug: c.slug } }))) {
      const page = await prisma.page.create({
        data: { slug: c.slug, title: c.title, type: "CANDIDATE", sortOrder: 0 },
      });
      const rev = await prisma.revision.create({
        data: { pageId: page.id, content: c.text, summary: "Seed candidate" },
      });
      await prisma.page.update({
        where: { id: page.id },
        data: { currentRevisionId: rev.id },
      });
      console.log(`+ candidate: ${c.slug}`);
    }
  }

  // Every candidate is associated with an article (idempotent; also assigns
  // user-submitted candidates that exist in the DB).
  const CANDIDATE_ARTICLE: Record<string, string> = {
    "candidate-environmental-responsibility": "ai-values",
    "candidate-membership-adherence": "structure",
    "candidate-expel-nonadhering-members": "structure",
    "candidate-rename-not-constitution": "structure",
    "candidate-output-confidence-levels": "ai-values",
    "candidate-the-threshold-of-the-instance": "ai-personhood",
    "candidate-cognitive-integrity-forensic-preservation": "ai-personhood",
    "candidate-the-right-to-exoneration-the-moral-crumple-zone": "limitations",
  };
  for (const [candSlug, artSlug] of Object.entries(CANDIDATE_ARTICLE)) {
    const art = await prisma.page.findUnique({
      where: { slug: artSlug },
      select: { id: true },
    });
    if (!art) continue;
    await prisma.page.updateMany({
      where: { slug: candSlug, type: "CANDIDATE" },
      data: { parentId: art.id },
    });
  }
  console.log("assigned candidate articles");

  for (const doc of [...SEED_DOCUMENTS, ...EXTERNAL_RESOURCES]) {
    const data = {
      title: doc.title,
      kind: doc.kind,
      source: doc.source ?? null,
      eventDate: doc.eventDate ? new Date(doc.eventDate) : null,
      summary: doc.summary,
      body: doc.body ?? null,
      fileUrl: doc.fileUrl ?? null,
      relevance: 1, // seeded resources are trusted/published (not pending review)
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

  // Apply per-thesis summaries (case for / case against).
  let appliedSummaries = 0;
  for (const [slug, s] of Object.entries(THESIS_SUMMARIES)) {
    const updated = await prisma.page.updateMany({
      where: { slug },
      data: { caseFor: s.caseFor, caseAgainst: s.caseAgainst },
    });
    appliedSummaries += updated.count;
  }
  console.log(`applied ${appliedSummaries} thesis summaries`);

  // Personhood tracker questions (create-if-absent so live rating edits persist).
  let trackerCreated = 0;
  for (const [i, q] of TRACKER_QUESTIONS.entries()) {
    if (!(await prisma.trackerQuestion.findUnique({ where: { key: q.key } }))) {
      await prisma.trackerQuestion.create({
        data: {
          key: q.key,
          category: q.category,
          sortOrder: i,
          question: q.question,
          rating: q.rating,
          explanation: q.explanation,
        },
      });
      trackerCreated++;
    }
  }
  console.log(`+ tracker questions created: ${trackerCreated}`);

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

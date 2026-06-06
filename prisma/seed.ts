import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { ARTICLES } from "../src/content/seed-content";
import { adminEmails } from "../src/lib/env";

async function ensureArticle(a: (typeof ARTICLES)[number]) {
  const existing = await prisma.page.findUnique({ where: { slug: a.slug } });
  if (existing) {
    console.log(`= ${a.slug} already exists — skipping`);
    return;
  }

  // Presentation (constitution) page + initial revision.
  const page = await prisma.page.create({
    data: {
      slug: a.slug,
      title: a.title,
      category: "PRESENTATION",
      sortOrder: a.sortOrder,
    },
  });
  const rev = await prisma.revision.create({
    data: {
      pageId: page.id,
      content: a.body,
      summary: "Initial import from ASFAI AI Theses",
    },
  });

  // Paired discussion page + initial revision.
  const discussion = await prisma.page.create({
    data: {
      slug: `${a.slug}-discussion`,
      title: `${a.title} — Discussion`,
      category: "DISCUSSION",
      sortOrder: a.sortOrder,
    },
  });
  const drev = await prisma.revision.create({
    data: {
      pageId: discussion.id,
      content: a.discussionStarter,
      summary: "Discussion page created",
    },
  });

  // Point each page at its current revision and link the pair (FK on the
  // presentation side; the discussion side is reachable via `linkedFrom`).
  await prisma.page.update({
    where: { id: page.id },
    data: { currentRevisionId: rev.id, linkedPageId: discussion.id },
  });
  await prisma.page.update({
    where: { id: discussion.id },
    data: { currentRevisionId: drev.id },
  });

  console.log(`+ created ${a.slug} (+ discussion)`);
}

async function main() {
  for (const a of ARTICLES) await ensureArticle(a);

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

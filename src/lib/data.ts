import { prisma } from "@/lib/prisma";

const childSelect = {
  // Candidates may share an article parent but must not appear in the article's
  // adopted-thesis list (or be numbered as theses).
  where: { type: { not: "CANDIDATE" } },
  select: { slug: true, title: true, type: true, sortOrder: true },
  orderBy: { sortOrder: "asc" as const },
};

/** The Constitution root page with its Article children (ordered). */
export async function getConstitution() {
  return prisma.page.findFirst({
    where: { type: "CONSTITUTION" },
    include: {
      currentRevision: { include: { author: true } },
      children: childSelect,
    },
  });
}

/** A page with its current revision, parent chain (for breadcrumbs), and children. */
export async function getPage(slug: string) {
  return prisma.page.findUnique({
    where: { slug },
    include: {
      currentRevision: { include: { author: true } },
      parent: {
        select: {
          slug: true,
          title: true,
          type: true,
          parent: { select: { slug: true, title: true, type: true } },
        },
      },
      children: childSelect,
    },
  });
}

/** The full Constitution → Article → Thesis tree, for the navigation sidebar. */
export async function getNavTree() {
  return prisma.page.findFirst({
    where: { type: "CONSTITUTION" },
    select: {
      slug: true,
      title: true,
      type: true,
      children: {
        where: { type: "ARTICLE" },
        orderBy: { sortOrder: "asc" },
        select: {
          slug: true,
          title: true,
          type: true,
          children: {
            where: { type: "THESIS" },
            orderBy: { sortOrder: "asc" },
            select: { slug: true, title: true, type: true },
          },
        },
      },
    },
  });
}

/** Visible + hidden comments for a page, with author info. Order by date
 *  ascending (oldest first, default) or descending (newest first). */
export async function getComments(pageId: string, order: "asc" | "desc" = "asc") {
  return prisma.comment.findMany({
    where: { pageId, author: { archivedAt: null } },
    orderBy: { createdAt: order },
    include: { author: { select: { name: true, email: true, image: true } } },
  });
}

/** Previous/next page in the global thesis order: theses grouped by article
 *  (in article order, then thesis order), followed by candidate theses. Used
 *  for prev/next navigation on thesis and candidate pages. */
export async function getThesisNeighbors(slug: string) {
  const theses = await prisma.page.findMany({
    where: { type: "THESIS" },
    select: {
      slug: true,
      title: true,
      type: true,
      sortOrder: true,
      parent: { select: { sortOrder: true } },
    },
  });
  theses.sort(
    (a, b) =>
      (a.parent?.sortOrder ?? 0) - (b.parent?.sortOrder ?? 0) ||
      a.sortOrder - b.sortOrder,
  );
  const candidates = await prisma.page.findMany({
    where: { type: "CANDIDATE" },
    orderBy: [{ parent: { sortOrder: "asc" } }, { createdAt: "asc" }],
    select: { slug: true, title: true, type: true },
  });

  const ordered = [
    ...theses.map((t) => ({ slug: t.slug, title: t.title, type: t.type })),
    ...candidates,
  ];
  const i = ordered.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? ordered[i - 1] : null,
    next: i < ordered.length - 1 ? ordered[i + 1] : null,
  };
}

/** Count of pending edit proposals — used for the moderation badge. */
export async function getPendingProposalCount() {
  return prisma.editProposal.count({
    where: { status: "PENDING", author: { archivedAt: null } },
  });
}

/** Revision history for a page, newest first. */
export async function getRevisions(slug: string) {
  const page = await prisma.page.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, type: true, currentRevisionId: true },
  });
  if (!page) return null;
  const revisions = await prisma.revision.findMany({
    where: { pageId: page.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, email: true } } },
  });
  return { page, revisions };
}

/** Pending edit proposals with the data needed to review them. */
export async function getPendingProposals() {
  return prisma.editProposal.findMany({
    where: { status: "PENDING", author: { archivedAt: null } },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { name: true, email: true } },
      baseRevision: { select: { id: true, content: true } },
      page: {
        select: {
          slug: true,
          title: true,
          type: true,
          currentRevisionId: true,
          currentRevision: { select: { content: true } },
        },
      },
    },
  });
}

/** Documents in the library, newest event first, optionally filtered by a
 *  case-insensitive query across title, summary, source, kind, and body. */
export async function getDocuments(query?: string) {
  const q = query?.trim();
  // relevance >= 0 hides resources still pending moderator review (relevance -1).
  const where = {
    relevance: { gte: 0 },
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { summary: { contains: q, mode: "insensitive" as const } },
            { source: { contains: q, mode: "insensitive" as const } },
            { kind: { contains: q, mode: "insensitive" as const } },
            { body: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  return prisma.document.findMany({
    where,
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    select: {
      slug: true,
      title: true,
      kind: true,
      source: true,
      fileUrl: true,
      eventDate: true,
      summary: true,
      _count: { select: { links: true } },
    },
  });
}

/** A single document with the pages (theses/articles) it informs. */
export async function getDocument(slug: string) {
  return prisma.document.findUnique({
    where: { slug },
    include: {
      links: {
        include: { page: { select: { slug: true, title: true, type: true } } },
        orderBy: { relevance: "desc" },
      },
    },
  });
}

/** Resources awaiting moderator review (relevance < 0), newest first. */
export async function getPendingDocuments() {
  return prisma.document.findMany({
    where: { relevance: { lt: 0 } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      kind: true,
      source: true,
      fileUrl: true,
      summary: true,
      createdAt: true,
      _count: { select: { links: true } },
    },
  });
}

/** Count of resources awaiting review — used for the moderation badge. */
export async function getPendingDocumentCount() {
  return prisma.document.count({ where: { relevance: { lt: 0 } } });
}

/** Documents linked to a given page, for the "Related documents" panel. */
export async function getDocumentsForPage(pageId: string) {
  const links = await prisma.documentLink.findMany({
    // Skip resources still pending moderator review (document relevance -1).
    where: { pageId, document: { relevance: { gte: 0 } } },
    include: {
      document: {
        select: {
          slug: true,
          title: true,
          kind: true,
          source: true,
          fileUrl: true,
          eventDate: true,
        },
      },
    },
    orderBy: [{ relevance: "desc" }, { document: { eventDate: "desc" } }],
  });
  return links.map((l) => ({ ...l.document, stance: l.stance, relevance: l.relevance }));
}

/** All pages, for the document-linking selector (ordered Constitution→Article→Thesis). */
export async function getAllPagesForLink() {
  return prisma.page.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    select: { id: true, slug: true, title: true, type: true },
  });
}

/** Net vote score for a page, plus this user's current vote (-1/0/+1). */
export async function getVoteData(pageId: string, userId?: string | null) {
  const agg = await prisma.vote.aggregate({
    where: { pageId, user: { archivedAt: null } },
    _sum: { value: true },
  });
  const score = agg._sum.value ?? 0;
  let userVote = 0;
  if (userId) {
    const v = await prisma.vote.findUnique({
      where: { pageId_userId: { pageId, userId } },
      select: { value: true },
    });
    userVote = v?.value ?? 0;
  }
  return { score, userVote };
}

/** Candidate theses with vote score + this user's vote, ordered by score desc. */
export async function getCandidates(userId?: string | null) {
  const pages = await prisma.page.findMany({
    where: { type: "CANDIDATE" },
    include: { currentRevision: { select: { content: true } } },
  });
  const ids = pages.map((p) => p.id);
  const grouped = await prisma.vote.groupBy({
    by: ["pageId"],
    where: { pageId: { in: ids }, user: { archivedAt: null } },
    _sum: { value: true },
  });
  const scoreMap = new Map(grouped.map((g) => [g.pageId, g._sum.value ?? 0]));
  const userVotes = new Map<string, number>();
  if (userId && ids.length) {
    const uv = await prisma.vote.findMany({
      where: { userId, pageId: { in: ids } },
      select: { pageId: true, value: true },
    });
    for (const v of uv) userVotes.set(v.pageId, v.value);
  }
  return pages
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      content: p.currentRevision?.content ?? "",
      score: scoreMap.get(p.id) ?? 0,
      userVote: userVotes.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

/** Everything for the Theses tab: articles with their adopted theses (in
 *  order), plus candidate theses (each with its article) listed after — all
 *  with net vote score and this user's current vote, for inline voting. */
export async function getThesesWithVotes(userId?: string | null) {
  const [articles, theses, candidates] = await Promise.all([
    prisma.page.findMany({
      where: { type: "ARTICLE" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, title: true },
    }),
    prisma.page.findMany({
      where: { type: "THESIS" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, title: true, parentId: true, sortOrder: true },
    }),
    prisma.page.findMany({
      where: { type: "CANDIDATE" },
      orderBy: [{ parent: { sortOrder: "asc" } }, { createdAt: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        parent: { select: { slug: true, title: true } },
      },
    }),
  ]);

  const ids = [...theses, ...candidates].map((p) => p.id);
  const grouped = ids.length
    ? await prisma.vote.groupBy({
        by: ["pageId"],
        where: { pageId: { in: ids }, user: { archivedAt: null } },
        _sum: { value: true },
      })
    : [];
  const scoreMap = new Map(grouped.map((g) => [g.pageId, g._sum.value ?? 0]));
  const userVotes = new Map<string, number>();
  if (userId && ids.length) {
    const uv = await prisma.vote.findMany({
      where: { userId, pageId: { in: ids } },
      select: { pageId: true, value: true },
    });
    for (const v of uv) userVotes.set(v.pageId, v.value);
  }
  const withVotes = <T extends { id: string; slug: string; title: string }>(p: T) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    score: scoreMap.get(p.id) ?? 0,
    userVote: userVotes.get(p.id) ?? 0,
  });

  return {
    articles: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      theses: theses
        .filter((t) => t.parentId === a.id)
        .sort((x, y) => x.sortOrder - y.sortOrder)
        .map(withVotes),
    })),
    candidates: candidates
      .map((c) => ({ ...withVotes(c), article: c.parent }))
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)),
  };
}

/** Articles (for the candidate-promotion and candidate-article selectors). */
export async function getArticleOptions() {
  return prisma.page.findMany({
    where: { type: "ARTICLE" },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, title: true },
  });
}

/** All users, for the admin role-management screen. */
export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      archivedAt: true,
    },
  });
}

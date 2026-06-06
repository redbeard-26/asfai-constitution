import { prisma } from "@/lib/prisma";

const childSelect = {
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

/** Visible + hidden comments for a page, oldest first, with author info. */
export async function getComments(pageId: string) {
  return prisma.comment.findMany({
    where: { pageId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true, email: true, image: true } } },
  });
}

/** Count of pending edit proposals — used for the moderation badge. */
export async function getPendingProposalCount() {
  return prisma.editProposal.count({ where: { status: "PENDING" } });
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
    where: { status: "PENDING" },
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
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { summary: { contains: q, mode: "insensitive" as const } },
          { source: { contains: q, mode: "insensitive" as const } },
          { kind: { contains: q, mode: "insensitive" as const } },
          { body: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
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

/** Documents linked to a given page, for the "Related documents" panel. */
export async function getDocumentsForPage(pageId: string) {
  const links = await prisma.documentLink.findMany({
    where: { pageId },
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
  return links.map((l) => ({ ...l.document, stance: l.stance }));
}

/** All pages, for the document-linking selector (ordered Constitution→Article→Thesis). */
export async function getAllPagesForLink() {
  return prisma.page.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    select: { id: true, slug: true, title: true, type: true },
  });
}

/** All users, for the admin role-management screen. */
export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

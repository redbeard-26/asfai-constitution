import { prisma } from "@/lib/prisma";

/** Presentation (constitution) articles, ordered for the sidebar/nav. */
export async function getArticles() {
  return prisma.page.findMany({
    where: { category: "PRESENTATION" },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      linkedPage: { select: { slug: true } },
    },
  });
}

/** A page with its current revision and (one level of) linked page. */
export async function getPage(slug: string) {
  return prisma.page.findUnique({
    where: { slug },
    include: {
      currentRevision: { include: { author: true } },
      linkedPage: { select: { slug: true, title: true, category: true } },
      linkedFrom: { select: { slug: true, title: true, category: true } },
    },
  });
}

/** Visible comments for a page, oldest first, with author info. */
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
    select: { id: true, slug: true, title: true, category: true, currentRevisionId: true },
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
          category: true,
          currentRevisionId: true,
          currentRevision: { select: { content: true } },
        },
      },
    },
  });
}

/** All users, for the admin role-management screen. */
export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

/** Returns the page a given page is paired with, in either direction. */
export function pairedPage<
  T extends {
    linkedPage: { slug: string; title: string; category: string } | null;
    linkedFrom: { slug: string; title: string; category: string } | null;
  },
>(page: T) {
  return page.linkedPage ?? page.linkedFrom ?? null;
}

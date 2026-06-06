"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireModerator, requireAdmin } from "@/lib/session";
import { pageHref, ROLES, isModerator, type Role } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";

async function logAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  meta?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });
}

// ---------------------------------------------------------------------------
// Edit proposals
// ---------------------------------------------------------------------------

const proposeSchema = z.object({
  pageId: z.string().min(1),
  baseRevisionId: z.string().optional().nullable(),
  proposedContent: z.string().min(1, "Content cannot be empty."),
  summary: z.string().max(300).optional(),
});

export async function proposeEdit(formData: FormData) {
  const user = await requireUser();
  if (!isModerator(user.role)) {
    await checkRateLimit("editProposal", user.id, {
      windowMs: 10 * 60_000,
      max: 5,
      label: "edit proposals",
    });
  }
  const parsed = proposeSchema.parse({
    pageId: formData.get("pageId"),
    baseRevisionId: formData.get("baseRevisionId") || null,
    proposedContent: formData.get("proposedContent"),
    summary: formData.get("summary") || undefined,
  });

  const page = await prisma.page.findUnique({
    where: { id: parsed.pageId },
    select: { slug: true, type: true, currentRevision: { select: { content: true } } },
  });
  if (!page) throw new Error("Page not found.");

  // No-op guard: don't create a proposal identical to the current content.
  if (page.currentRevision?.content.trim() === parsed.proposedContent.trim()) {
    throw new Error("Your proposed content is identical to the current version.");
  }

  const proposal = await prisma.editProposal.create({
    data: {
      pageId: parsed.pageId,
      baseRevisionId: parsed.baseRevisionId ?? null,
      proposedContent: parsed.proposedContent,
      summary: parsed.summary,
      authorId: user.id,
      status: "PENDING",
    },
  });
  await logAudit(user.id, "PROPOSE_EDIT", "EditProposal", proposal.id, {
    pageId: parsed.pageId,
  });

  revalidatePath("/moderation");
  redirect(`${pageHref(page)}?proposed=1`);
}

export async function approveProposal(formData: FormData) {
  const mod = await requireModerator();
  const proposalId = String(formData.get("proposalId"));

  const proposal = await prisma.editProposal.findUnique({
    where: { id: proposalId },
    include: { page: { select: { id: true, slug: true, type: true } } },
  });
  if (!proposal) throw new Error("Proposal not found.");
  if (proposal.status !== "PENDING") throw new Error("Proposal already resolved.");

  await prisma.$transaction(async (tx) => {
    const revision = await tx.revision.create({
      data: {
        pageId: proposal.pageId,
        content: proposal.proposedContent,
        summary: proposal.summary ?? "Approved edit",
        authorId: proposal.authorId,
      },
    });
    await tx.page.update({
      where: { id: proposal.pageId },
      data: { currentRevisionId: revision.id },
    });
    await tx.editProposal.update({
      where: { id: proposal.id },
      data: { status: "APPROVED", reviewerId: mod.id, resolvedAt: new Date() },
    });
  });
  await logAudit(mod.id, "APPROVE_PROPOSAL", "EditProposal", proposal.id, {
    pageId: proposal.pageId,
  });

  revalidatePath("/moderation");
  revalidatePath(pageHref(proposal.page));
  revalidatePath(`/history/${proposal.page.slug}`);
}

export async function rejectProposal(formData: FormData) {
  const mod = await requireModerator();
  const proposalId = String(formData.get("proposalId"));
  const note = (formData.get("reviewNote") as string) || null;

  const proposal = await prisma.editProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new Error("Proposal not found.");
  if (proposal.status !== "PENDING") throw new Error("Proposal already resolved.");

  await prisma.editProposal.update({
    where: { id: proposalId },
    data: {
      status: "REJECTED",
      reviewerId: mod.id,
      reviewNote: note,
      resolvedAt: new Date(),
    },
  });
  await logAudit(mod.id, "REJECT_PROPOSAL", "EditProposal", proposalId);

  revalidatePath("/moderation");
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

const commentSchema = z.object({
  pageId: z.string().min(1),
  parentId: z.string().optional().nullable(),
  body: z.string().min(1, "Comment cannot be empty.").max(5000),
  path: z.string().min(1),
});

export async function postComment(formData: FormData) {
  const user = await requireUser();
  if (!isModerator(user.role)) {
    await checkRateLimit("comment", user.id, {
      windowMs: 5 * 60_000,
      max: 10,
      label: "comments",
    });
  }
  const parsed = commentSchema.parse({
    pageId: formData.get("pageId"),
    parentId: formData.get("parentId") || null,
    body: formData.get("body"),
    path: formData.get("path"),
  });

  await prisma.comment.create({
    data: {
      pageId: parsed.pageId,
      parentId: parsed.parentId ?? null,
      body: parsed.body,
      authorId: user.id,
      status: "VISIBLE",
    },
  });

  revalidatePath(parsed.path);
}

export async function deleteOwnComment(formData: FormData) {
  const user = await requireUser();
  const commentId = String(formData.get("commentId"));
  const path = String(formData.get("path"));

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found.");
  if (comment.authorId !== user.id) throw new Error("You can only delete your own comment.");

  await prisma.comment.update({
    where: { id: commentId },
    data: { status: "HIDDEN" },
  });
  revalidatePath(path);
}

export async function setCommentVisibility(formData: FormData) {
  const mod = await requireModerator();
  const commentId = String(formData.get("commentId"));
  const path = String(formData.get("path"));
  const hide = formData.get("hide") === "1";

  await prisma.comment.update({
    where: { id: commentId },
    data: { status: hide ? "HIDDEN" : "VISIBLE" },
  });
  await logAudit(mod.id, hide ? "HIDE_COMMENT" : "UNHIDE_COMMENT", "Comment", commentId);

  revalidatePath(path);
}

// ---------------------------------------------------------------------------
// Page history (moderator revert)
// ---------------------------------------------------------------------------

export async function revertToRevision(formData: FormData) {
  const mod = await requireModerator();
  const revisionId = String(formData.get("revisionId"));

  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
    include: { page: { select: { id: true, slug: true, type: true } } },
  });
  if (!revision) throw new Error("Revision not found.");

  await prisma.$transaction(async (tx) => {
    const newRev = await tx.revision.create({
      data: {
        pageId: revision.pageId,
        content: revision.content,
        summary: `Reverted to revision ${revisionId.slice(0, 8)}`,
        authorId: mod.id,
      },
    });
    await tx.page.update({
      where: { id: revision.pageId },
      data: { currentRevisionId: newRev.id },
    });
  });
  await logAudit(mod.id, "REVERT", "Revision", revisionId, {
    pageId: revision.pageId,
  });

  revalidatePath(pageHref(revision.page));
  revalidatePath(`/history/${revision.page.slug}`);
}

// ---------------------------------------------------------------------------
// Roles (admin)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Documents (moderator-curated library)
// ---------------------------------------------------------------------------

const documentSchema = z
  .object({
    title: z.string().min(1, "Title is required.").max(300),
    kind: z.string().max(60).optional(),
    source: z.string().max(200).optional(),
    eventDate: z.string().optional(),
    summary: z.string().max(2000).optional(),
    body: z.string().max(100000).optional(),
    fileUrl: z.string().url().optional().or(z.literal("")),
  })
  .refine(
    (d) => Boolean(d.body?.trim() || d.fileUrl?.trim() || d.summary?.trim()),
    { message: "Provide a body, a URL, or a summary.", path: ["body"] },
  );

function docData(parsed: z.infer<typeof documentSchema>) {
  return {
    title: parsed.title,
    kind: parsed.kind || "Reference",
    source: parsed.source || null,
    eventDate: parsed.eventDate ? new Date(parsed.eventDate) : null,
    summary: parsed.summary || null,
    body: parsed.body || null,
    fileUrl: parsed.fileUrl || null,
  };
}

async function uniqueDocSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "document";
  let slug = root;
  let n = 1;
  // Append -2, -3, … until unique.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.document.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

export async function createDocument(formData: FormData) {
  const mod = await requireModerator();
  const parsed = documentSchema.parse({
    title: formData.get("title"),
    kind: formData.get("kind") || undefined,
    source: formData.get("source") || undefined,
    eventDate: formData.get("eventDate") || undefined,
    summary: formData.get("summary") || undefined,
    body: formData.get("body") || undefined,
    fileUrl: formData.get("fileUrl") || "",
  });

  const slug = await uniqueDocSlug(parsed.title);
  const doc = await prisma.document.create({
    data: { slug, ...docData(parsed), createdById: mod.id },
  });
  await logAudit(mod.id, "CREATE_DOCUMENT", "Document", doc.id);

  revalidatePath("/docs");
  redirect(`/docs/${slug}/edit`);
}

export async function updateDocument(formData: FormData) {
  const mod = await requireModerator();
  const id = String(formData.get("documentId"));
  const parsed = documentSchema.parse({
    title: formData.get("title"),
    kind: formData.get("kind") || undefined,
    source: formData.get("source") || undefined,
    eventDate: formData.get("eventDate") || undefined,
    summary: formData.get("summary") || undefined,
    body: formData.get("body") || undefined,
    fileUrl: formData.get("fileUrl") || "",
  });

  const doc = await prisma.document.update({
    where: { id },
    data: docData(parsed),
  });
  await logAudit(mod.id, "UPDATE_DOCUMENT", "Document", doc.id);

  revalidatePath(`/docs/${doc.slug}`);
  revalidatePath(`/docs/${doc.slug}/edit`);
  revalidatePath("/docs");
}

export async function deleteDocument(formData: FormData) {
  const mod = await requireModerator();
  const id = String(formData.get("documentId"));
  const doc = await prisma.document.delete({ where: { id } });
  await logAudit(mod.id, "DELETE_DOCUMENT", "Document", id);
  revalidatePath("/docs");
  redirect("/docs");
}

export async function linkDocument(formData: FormData) {
  const mod = await requireModerator();
  const documentId = String(formData.get("documentId"));
  const pageId = String(formData.get("pageId"));
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { slug: true },
  });
  if (!doc) throw new Error("Document not found.");

  // Ignore duplicates (unique constraint on [documentId, pageId]).
  const existing = await prisma.documentLink.findUnique({
    where: { documentId_pageId: { documentId, pageId } },
  });
  if (!existing) {
    await prisma.documentLink.create({ data: { documentId, pageId } });
    await logAudit(mod.id, "LINK_DOCUMENT", "Document", documentId, { pageId });
  }

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { slug: true, type: true },
  });
  revalidatePath(`/docs/${doc.slug}`);
  revalidatePath(`/docs/${doc.slug}/edit`);
  if (page) revalidatePath(pageHref(page));
}

export async function unlinkDocument(formData: FormData) {
  const mod = await requireModerator();
  const linkId = String(formData.get("linkId"));
  const link = await prisma.documentLink.findUnique({
    where: { id: linkId },
    include: {
      document: { select: { slug: true } },
      page: { select: { slug: true, type: true } },
    },
  });
  if (!link) return;
  await prisma.documentLink.delete({ where: { id: linkId } });
  await logAudit(mod.id, "UNLINK_DOCUMENT", "Document", link.documentId, {
    pageId: link.pageId,
  });
  revalidatePath(`/docs/${link.document.slug}`);
  revalidatePath(`/docs/${link.document.slug}/edit`);
  revalidatePath(pageHref(link.page));
}

export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role"));

  if (!ROLES.includes(role as Role)) throw new Error("Invalid role.");
  if (userId === admin.id) throw new Error("You cannot change your own role.");

  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAudit(admin.id, "SET_ROLE", "User", userId, { role });

  revalidatePath("/admin/users");
}

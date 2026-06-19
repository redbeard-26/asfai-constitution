import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getConstitution,
  getNavTree,
  getPage,
  getDocuments,
  getDocument,
  getDocumentsForPage,
  getCandidates,
  getComments,
  getVoteData,
} from "@/lib/data";
import { slugify } from "@/lib/slug";
import { displayName } from "@/lib/format";

export const maxDuration = 60;

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
function err(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

/** Resolve (find or create) a user by email so a tool can act on their behalf. */
async function resolveUser(email: string) {
  const e = email.trim().toLowerCase();
  return prisma.user.upsert({
    where: { email: e },
    update: {},
    create: { email: e, role: "VIEWER" },
  });
}

async function uniqueCandidateSlug(title: string) {
  const root = slugify(`candidate-${title}`) || "candidate";
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!(await prisma.page.findUnique({ where: { slug } }))) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

const handler = createMcpHandler(
  (server) => {
    // ===================== READ TOOLS =====================

    server.registerTool(
      "get_constitution",
      {
        title: "Get the AI Constitution",
        description:
          "Returns the AI Constitution: its preamble and the full tree of articles and theses (slugs + titles).",
        inputSchema: {},
      },
      async () => {
        const [root, tree] = await Promise.all([getConstitution(), getNavTree()]);
        if (!root || !tree) return err("Constitution not found.");
        return json({
          title: root.title,
          preamble: root.currentRevision?.content ?? null,
          articles: tree.children.map((a) => ({
            slug: a.slug,
            title: a.title,
            theses: a.children.map((t) => ({ slug: t.slug, title: t.title })),
          })),
        });
      },
    );

    server.registerTool(
      "get_article",
      {
        title: "Get an article",
        description: "Returns an article's text and the list of its theses (slug + title).",
        inputSchema: { slug: z.string().describe("Article slug, e.g. 'human-rights'") },
      },
      async ({ slug }) => {
        const page = await getPage(slug);
        if (!page || page.type !== "ARTICLE") return err(`No article '${slug}'.`);
        return json({
          slug: page.slug,
          title: page.title,
          text: page.currentRevision?.content ?? null,
          theses: page.children.map((t) => ({ slug: t.slug, title: t.title })),
        });
      },
    );

    server.registerTool(
      "get_thesis",
      {
        title: "Get a thesis",
        description:
          "Returns a thesis's text, the summary arguments (caseFor / caseAgainst, where caseAgainst leads with the central tradeoff), breadcrumb, vote score, and linked resources — each with stance (SUPPORTS/NEUTRAL/OPPOSES) and relevance (0-1).",
        inputSchema: { slug: z.string().describe("Thesis or candidate slug") },
      },
      async ({ slug }) => {
        const page = await getPage(slug);
        if (!page) return err(`No page '${slug}'.`);
        const [resources, vote] = await Promise.all([
          getDocumentsForPage(page.id),
          getVoteData(page.id),
        ]);
        return json({
          slug: page.slug,
          title: page.title,
          type: page.type,
          text: page.currentRevision?.content ?? null,
          caseFor: page.caseFor,
          caseAgainst: page.caseAgainst,
          voteScore: vote.score,
          parent: page.parent ? { slug: page.parent.slug, title: page.parent.title } : null,
          relatedResources: resources.map((r) => ({
            slug: r.slug,
            title: r.title,
            source: r.source,
            url: r.fileUrl,
            kind: r.kind,
            stance: r.stance,
            relevance: r.relevance,
          })),
        });
      },
    );

    server.registerTool(
      "list_candidates",
      {
        title: "List candidate theses",
        description:
          "Lists proposed (candidate) theses not yet adopted into an article, ordered by net vote score (desc).",
        inputSchema: {},
      },
      async () => {
        const candidates = await getCandidates();
        return json(
          candidates.map((c) => ({ slug: c.slug, title: c.title, score: c.score, text: c.content })),
        );
      },
    );

    server.registerTool(
      "search_resources",
      {
        title: "Search resources",
        description:
          "Full-text search of the resource library (panel reports, papers, frameworks, external links).",
        inputSchema: { query: z.string().describe("Search terms") },
      },
      async ({ query }) => {
        const docs = await getDocuments(query);
        return json(
          docs.map((d) => ({
            slug: d.slug,
            title: d.title,
            kind: d.kind,
            source: d.source,
            url: d.fileUrl,
            summary: d.summary,
          })),
        );
      },
    );

    server.registerTool(
      "get_resource",
      {
        title: "Get a resource",
        description:
          "Returns a single resource (its summary, body, source, URL) and the pages it informs, each with stance and relevance.",
        inputSchema: { slug: z.string().describe("Resource slug") },
      },
      async ({ slug }) => {
        const doc = await getDocument(slug);
        if (!doc) return err(`No resource '${slug}'.`);
        return json({
          slug: doc.slug,
          title: doc.title,
          kind: doc.kind,
          source: doc.source,
          url: doc.fileUrl,
          eventDate: doc.eventDate,
          summary: doc.summary,
          body: doc.body,
          informs: doc.links.map((l) => ({
            slug: l.page.slug,
            title: l.page.title,
            type: l.page.type,
            stance: l.stance,
            relevance: l.relevance,
          })),
        });
      },
    );

    server.registerTool(
      "list_resources_for_page",
      {
        title: "List resources for a page",
        description:
          "Lists resources linked to a page (constitution/article/thesis/candidate), ordered by relevance, each with stance + relevance.",
        inputSchema: { slug: z.string().describe("Page slug") },
      },
      async ({ slug }) => {
        const page = await prisma.page.findUnique({ where: { slug }, select: { id: true } });
        if (!page) return err(`No page '${slug}'.`);
        const resources = await getDocumentsForPage(page.id);
        return json(
          resources.map((r) => ({
            slug: r.slug,
            title: r.title,
            source: r.source,
            url: r.fileUrl,
            kind: r.kind,
            stance: r.stance,
            relevance: r.relevance,
          })),
        );
      },
    );

    server.registerTool(
      "list_comments",
      {
        title: "List discussion comments",
        description: "Lists the visible discussion comments on a page.",
        inputSchema: { slug: z.string().describe("Page slug") },
      },
      async ({ slug }) => {
        const page = await prisma.page.findUnique({ where: { slug }, select: { id: true } });
        if (!page) return err(`No page '${slug}'.`);
        const comments = await getComments(page.id);
        return json(
          comments
            .filter((c) => c.status === "VISIBLE")
            .map((c) => ({
              id: c.id,
              parentId: c.parentId,
              author: displayName(c.author),
              body: c.body,
              createdAt: c.createdAt,
            })),
        );
      },
    );

    // ===================== USER ACTIONS (require email) =====================

    server.registerTool(
      "vote",
      {
        title: "Vote on a thesis or candidate",
        description:
          "Cast an up or down vote (re-voting the same direction removes the vote). Acts as the user identified by email.",
        inputSchema: {
          slug: z.string().describe("Thesis or candidate slug"),
          direction: z.enum(["up", "down"]),
          email: z.string().email().describe("Email identifying the voting user"),
        },
      },
      async ({ slug, direction, email }) => {
        const page = await prisma.page.findUnique({ where: { slug }, select: { id: true } });
        if (!page) return err(`No page '${slug}'.`);
        const user = await resolveUser(email);
        const value = direction === "down" ? -1 : 1;
        const existing = await prisma.vote.findUnique({
          where: { pageId_userId: { pageId: page.id, userId: user.id } },
        });
        let action: string;
        if (existing && existing.value === value) {
          await prisma.vote.delete({ where: { id: existing.id } });
          action = "removed";
        } else {
          await prisma.vote.upsert({
            where: { pageId_userId: { pageId: page.id, userId: user.id } },
            update: { value },
            create: { pageId: page.id, userId: user.id, value },
          });
          action = direction;
        }
        const agg = await prisma.vote.aggregate({
          where: { pageId: page.id },
          _sum: { value: true },
        });
        return json({ ok: true, action, score: agg._sum.value ?? 0 });
      },
    );

    server.registerTool(
      "post_comment",
      {
        title: "Post a discussion comment",
        description: "Add a comment to a page's discussion, as the user identified by email.",
        inputSchema: {
          slug: z.string().describe("Page slug"),
          body: z.string().min(1).max(5000),
          email: z.string().email().describe("Email identifying the commenter"),
          parentId: z.string().optional().describe("Parent comment id to reply to"),
        },
      },
      async ({ slug, body, email, parentId }) => {
        const page = await prisma.page.findUnique({ where: { slug }, select: { id: true } });
        if (!page) return err(`No page '${slug}'.`);
        const user = await resolveUser(email);
        const comment = await prisma.comment.create({
          data: {
            pageId: page.id,
            authorId: user.id,
            body,
            parentId: parentId ?? null,
            status: "VISIBLE",
          },
        });
        return json({ ok: true, commentId: comment.id });
      },
    );

    server.registerTool(
      "propose_edit",
      {
        title: "Propose an edit",
        description:
          "Submit a proposed edit to a page. Enters the moderation queue and is NOT published until a human moderator approves it. Acts as the user identified by email.",
        inputSchema: {
          slug: z.string().describe("Slug of the page to edit"),
          proposedContent: z.string().min(1).max(50000).describe("Full proposed markdown"),
          summary: z.string().max(300).optional(),
          email: z.string().email().describe("Email identifying the proposer"),
        },
      },
      async ({ slug, proposedContent, summary, email }) => {
        const page = await prisma.page.findUnique({
          where: { slug },
          select: { id: true, currentRevisionId: true, currentRevision: { select: { content: true } } },
        });
        if (!page) return err(`No page '${slug}'.`);
        if (page.currentRevision?.content.trim() === proposedContent.trim()) {
          return err("Proposed content is identical to the current version.");
        }
        const user = await resolveUser(email);
        const proposal = await prisma.editProposal.create({
          data: {
            pageId: page.id,
            baseRevisionId: page.currentRevisionId ?? null,
            proposedContent,
            summary,
            authorId: user.id,
            status: "PENDING",
          },
        });
        return json({
          ok: true,
          proposalId: proposal.id,
          status: "PENDING",
          message: "Submitted for moderator review; not published until approved.",
        });
      },
    );

    server.registerTool(
      "create_candidate",
      {
        title: "Propose a candidate thesis",
        description:
          "Submit a new candidate thesis (uncategorized). It appears immediately on the candidates list for community voting. Acts as the user identified by email.",
        inputSchema: {
          title: z.string().min(1).max(200),
          text: z.string().min(1).max(20000),
          caseFor: z
            .string()
            .max(4000)
            .optional()
            .describe("Optional: the case for including this thesis"),
          caseAgainst: z
            .string()
            .max(4000)
            .optional()
            .describe("Optional: the case for changing or excluding this thesis"),
          email: z.string().email().describe("Email identifying the proposer"),
        },
      },
      async ({ title, text, caseFor, caseAgainst, email }) => {
        const user = await resolveUser(email);
        const slug = await uniqueCandidateSlug(title);
        const page = await prisma.page.create({
          data: {
            slug,
            title,
            type: "CANDIDATE",
            sortOrder: 0,
            caseFor: caseFor ?? null,
            caseAgainst: caseAgainst ?? null,
          },
        });
        const rev = await prisma.revision.create({
          data: { pageId: page.id, content: text, summary: "Candidate proposed via MCP", authorId: user.id },
        });
        await prisma.page.update({ where: { id: page.id }, data: { currentRevisionId: rev.id } });
        return json({ ok: true, slug: page.slug, message: "Candidate created; now open for voting." });
      },
    );
  },
  { serverInfo: { name: "ai-constitution", version: "2.0.0" } },
  { basePath: "/api", maxDuration: 60, verboseLogs: false },
);

export { handler as GET, handler as POST, handler as DELETE };

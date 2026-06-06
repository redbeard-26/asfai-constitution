import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getConstitution,
  getNavTree,
  getPage,
  getDocuments,
  getDocumentsForPage,
} from "@/lib/data";

export const maxDuration = 60;

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function err(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const handler = createMcpHandler(
  (server) => {
    // ---- Read: whole constitution structure ----
    server.registerTool(
      "get_constitution",
      {
        title: "Get the AI Constitution",
        description:
          "Returns the AI Constitution: its preamble and the full tree of articles and theses (slugs + titles). Use the slugs with get_article / get_thesis.",
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

    // ---- Read: a single article ----
    server.registerTool(
      "get_article",
      {
        title: "Get an article",
        description:
          "Returns an article's text and the list of its theses (slug + title). Pass the article slug, e.g. 'ai-values'.",
        inputSchema: { slug: z.string().describe("Article slug, e.g. 'human-rights'") },
      },
      async ({ slug }) => {
        const page = await getPage(slug);
        if (!page || page.type !== "ARTICLE") return err(`No article with slug '${slug}'.`);
        return json({
          slug: page.slug,
          title: page.title,
          text: page.currentRevision?.content ?? null,
          theses: page.children.map((t) => ({ slug: t.slug, title: t.title })),
        });
      },
    );

    // ---- Read: a single thesis (with related resources) ----
    server.registerTool(
      "get_thesis",
      {
        title: "Get a thesis",
        description:
          "Returns a thesis's text, its breadcrumb, and the external resources linked to it (with each resource's stance: SUPPORTS / NEUTRAL / OPPOSES). Pass the thesis slug.",
        inputSchema: { slug: z.string().describe("Thesis slug, e.g. 'limitations-superintelligence'") },
      },
      async ({ slug }) => {
        const page = await getPage(slug);
        if (!page) return err(`No page with slug '${slug}'.`);
        const resources = await getDocumentsForPage(page.id);
        return json({
          slug: page.slug,
          title: page.title,
          type: page.type,
          text: page.currentRevision?.content ?? null,
          parent: page.parent ? { slug: page.parent.slug, title: page.parent.title } : null,
          relatedResources: resources.map((r) => ({
            title: r.title,
            source: r.source,
            url: r.fileUrl,
            kind: r.kind,
            stance: r.stance,
          })),
        });
      },
    );

    // ---- Read/search: the resource library ----
    server.registerTool(
      "search_resources",
      {
        title: "Search resources",
        description:
          "Full-text search of the resource library (panel reports, papers, frameworks, external links). Returns matching resources with their URLs.",
        inputSchema: {
          query: z.string().describe("Search terms; matches title, source, kind, summary, and body"),
        },
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

    // ---- Read: resources linked to a given page ----
    server.registerTool(
      "list_resources_for_page",
      {
        title: "List resources for a page",
        description:
          "Lists the resources linked to a specific constitution/article/thesis (ordered by relevance), each with its stance.",
        inputSchema: { slug: z.string().describe("Page slug (constitution, article, or thesis)") },
      },
      async ({ slug }) => {
        const page = await prisma.page.findUnique({ where: { slug }, select: { id: true } });
        if (!page) return err(`No page with slug '${slug}'.`);
        const resources = await getDocumentsForPage(page.id);
        return json(
          resources.map((r) => ({
            title: r.title,
            source: r.source,
            url: r.fileUrl,
            kind: r.kind,
            stance: r.stance,
          })),
        );
      },
    );

    // ---- Write: propose an edit (enters the moderation queue) ----
    server.registerTool(
      "propose_edit",
      {
        title: "Propose an edit",
        description:
          "Submit a proposed edit to a page. The proposal enters the moderation queue and is NOT published until a human moderator approves it. Returns the proposal id.",
        inputSchema: {
          slug: z.string().describe("Slug of the page to edit"),
          proposedContent: z
            .string()
            .min(1)
            .max(50000)
            .describe("The full proposed markdown content for the page"),
          summary: z.string().max(300).optional().describe("Short summary of the change"),
          author: z
            .string()
            .max(120)
            .optional()
            .describe("Name/handle of the proposer (recorded in the summary)"),
        },
      },
      async ({ slug, proposedContent, summary, author }) => {
        const page = await prisma.page.findUnique({
          where: { slug },
          select: { id: true, currentRevisionId: true, currentRevision: { select: { content: true } } },
        });
        if (!page) return err(`No page with slug '${slug}'.`);
        if (page.currentRevision?.content.trim() === proposedContent.trim()) {
          return err("Proposed content is identical to the current version.");
        }
        const note = [summary, author ? `proposed via MCP by ${author}` : "proposed via MCP"]
          .filter(Boolean)
          .join(" — ");
        const proposal = await prisma.editProposal.create({
          data: {
            pageId: page.id,
            baseRevisionId: page.currentRevisionId ?? null,
            proposedContent,
            summary: note,
            status: "PENDING",
          },
        });
        return json({
          ok: true,
          proposalId: proposal.id,
          status: "PENDING",
          message:
            "Submitted for moderator review. It will not appear publicly until approved.",
        });
      },
    );
  },
  { serverInfo: { name: "ai-constitution", version: "1.0.0" } },
  { basePath: "/api", maxDuration: 60, verboseLogs: false },
);

export { handler as GET, handler as POST, handler as DELETE };

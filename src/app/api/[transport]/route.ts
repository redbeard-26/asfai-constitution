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
  getPersonhoodTracker,
} from "@/lib/data";
import { slugify } from "@/lib/slug";
import { displayName } from "@/lib/format";
import { buildTrackerSubmission, horizonDistance } from "@/lib/tracker";

export const maxDuration = 60;

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
function err(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

/** Human-readable personhood zone for a coordinate, matching the plot's bands. */
function personhoodZone(x: number, y: number): string {
  const d = horizonDistance(x, y);
  if (d < 50) return "personhood not justified";
  if (d < 100) return "personhood may be appropriate";
  return "personhood makes sense";
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
          "Submit a new candidate thesis associated with an article. It appears immediately on the Theses list for community voting. Acts as the user identified by email.",
        inputSchema: {
          title: z.string().min(1).max(200),
          text: z.string().min(1).max(20000),
          article: z
            .string()
            .describe("Slug of the article this candidate belongs to (see get_constitution)"),
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
      async ({ title, text, article, caseFor, caseAgainst, email }) => {
        const articlePage = await prisma.page.findUnique({
          where: { slug: article },
          select: { id: true, type: true },
        });
        if (!articlePage || articlePage.type !== "ARTICLE") {
          return err(`No article '${article}'. Use get_constitution to list article slugs.`);
        }
        const user = await resolveUser(email);
        const slug = await uniqueCandidateSlug(title);
        const page = await prisma.page.create({
          data: {
            slug,
            title,
            type: "CANDIDATE",
            parentId: articlePage.id,
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

    // ===================== PERSONHOOD TRACKER =====================

    server.registerTool(
      "get_personhood_tracker",
      {
        title: "Get the AI personhood tracker",
        description:
          "Returns the personhood-tracker questions to rate plus the existing public submissions. Each question is " +
          "rated 1-100. Two axes: x = social & economic integration (RMS of the SOCIAL questions), y = likelihood AI " +
          "is a sentient moral patient (RMS of the CONSCIOUSNESS questions). The 'personhood horizon' is the " +
          "quarter-circle sqrt(x^2 + y^2) = 100. To record an assessment, rate every question listed here and call " +
          "submit_personhood_assessment.",
        inputSchema: {},
      },
      async () => {
        const { questions, submissions } = await getPersonhoodTracker();
        const flat = [...questions.social, ...questions.consciousness].map((q) => ({
          key: q.key,
          category: q.category, // SOCIAL (x-axis) | CONSCIOUSNESS (y-axis)
          question: q.question,
          explanation: q.explanation,
        }));
        return json({
          ratingScale: "each question is rated 1-100",
          axes: {
            x: "social & economic need to grant AI rights — RMS of the SOCIAL questions",
            y: "likelihood AI is a sentient moral patient — RMS of the CONSCIOUSNESS questions",
          },
          horizon:
            "distance = sqrt(x^2 + y^2); <50 personhood not justified, 50-100 may be appropriate, >100 personhood makes sense",
          questions: flat,
          submissions: submissions.map((s) => ({
            id: s.id,
            name: s.name,
            by: s.userName,
            x: s.x,
            y: s.y,
            createdAt: s.createdAt,
            answers: s.answers,
          })),
        });
      },
    );

    server.registerTool(
      "submit_personhood_assessment",
      {
        title: "Submit a personhood assessment",
        description:
          "Save a public personhood assessment as the user identified by email: a 1-100 rating for every tracker " +
          "question (call get_personhood_tracker first for the keys). Stores the full per-question results and the " +
          "computed x/y coordinates — the same data format a browser submission produces — and returns the " +
          "coordinates, horizon distance, and zone.",
        inputSchema: {
          email: z.string().email().describe("Email identifying the submitter"),
          name: z
            .string()
            .min(1)
            .max(80)
            .describe("A label for this assessment, e.g. 'Claude, July 2026'"),
          answers: z
            .record(z.string(), z.number().int().min(1).max(100))
            .describe(
              "Map of every question key to its rating (1-100). Include all questions from get_personhood_tracker.",
            ),
        },
      },
      async ({ email, name, answers }) => {
        const active = await prisma.trackerQuestion.findMany({
          where: { active: true },
          select: { key: true, category: true },
        });
        const activeKeys = new Set(active.map((q) => q.key));
        const missing = active.filter((q) => !(q.key in answers)).map((q) => q.key);
        const unknown = Object.keys(answers).filter((k) => !activeKeys.has(k));
        if (missing.length) {
          return err(
            `Missing a rating for ${missing.length} question(s): ${missing.join(", ")}. ` +
              `Rate every question from get_personhood_tracker (1-100).`,
          );
        }
        if (unknown.length) {
          return err(
            `Unknown question key(s): ${unknown.join(", ")}. Use the keys from get_personhood_tracker.`,
          );
        }
        const { responses, x, y } = buildTrackerSubmission(answers, active);
        const user = await resolveUser(email);
        const submission = await prisma.trackerSubmission.create({
          data: { userId: user.id, name: name.trim(), x, y, responses: { create: responses } },
        });
        return json({
          ok: true,
          submissionId: submission.id,
          x,
          y,
          horizonDistance: horizonDistance(x, y),
          zone: personhoodZone(x, y),
          message: "Public assessment saved.",
        });
      },
    );
  },
  { serverInfo: { name: "ai-constitution", version: "2.0.0" } },
  { basePath: "/api", maxDuration: 60, verboseLogs: false },
);

export { handler as GET, handler as POST, handler as DELETE };

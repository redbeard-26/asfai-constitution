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
import {
  listSubjects,
  searchConcepts,
  getConcept,
  hardPrereqsOf,
  softPrereqsOf,
  unlocksOf,
  hardUnlockCount,
  computeFrontier,
  findLearningPath,
  neighborhood,
  type Topic,
  type Link,
} from "@/lib/taxonomy";
import {
  getMasteredIds,
  getProgress,
  recordMastery,
  setLearning,
} from "@/lib/learning";
import { renderKnowledgeGraph } from "@/lib/graph-artifact";
import { listSkills } from "@/lib/skills";
import { getTrackerSnapshot, renderPortableTracker } from "@/lib/portable-tracker";

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

/** Compact shape for a prerequisite/dependent link in tool output. */
function linkOut(l: Link) {
  return { id: l.id, name: l.name, strength: l.strength, reason: l.reason };
}

/** Full concept detail returned by concept-oriented tools. */
function conceptOut(t: Topic) {
  return {
    id: t.id,
    name: t.name,
    type: t.type,
    subject: t.subject,
    domain: t.domain,
    description: t.description,
    ageRange: [t.ageRangeStart, t.ageRangeEnd] as [number, number],
    centrality: t.centrality,
    evidence: t.evidence,
    standards: t.standards,
  };
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
            .record(z.string(), z.number().int().min(0).max(100))
            .describe(
              "Map of every question key to its rating (0-100). Include all questions from get_personhood_tracker.",
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

    server.registerTool(
      "get_portable_page",
      {
        title: "Get a portable ASFAI page",
        description:
          "Returns a self-contained, single-file HTML 'portable page' — all CSS/JS inline, a live " +
          "data snapshot embedded, progressive hydration, no external assets or storage. Republish " +
          "the returned HTML directly as an artifact for the user (no changes needed); it renders and " +
          "is interactive offline and refreshes from live data when online. Available slugs: " +
          "'personhood-tracker'. Omit slug to list available pages.",
        inputSchema: {
          slug: z
            .string()
            .optional()
            .describe("Which portable page to return, e.g. 'personhood-tracker'. Omit to list."),
        },
      },
      async ({ slug }) => {
        const pages = ["personhood-tracker"];
        if (!slug) return json({ pages });
        if (slug !== "personhood-tracker") {
          return err(`Unknown portable page '${slug}'. Available: ${pages.join(", ")}.`);
        }
        const html = renderPortableTracker(await getTrackerSnapshot());
        return { content: [{ type: "text" as const, text: html }] };
      },
    );

    // ---- MCP Apps: interactive UI resource (ui://) rendered inline by the host ----
    // The personhood tracker as an MCP Apps view (SEP-1865). The host reads this
    // ui:// resource and renders the HTML in a sandboxed iframe inside the chat;
    // open_personhood_tracker points at it via _meta.ui.resourceUri. The HTML is
    // self-contained with a fresh embedded snapshot, and csp.connectDomains lets
    // it also hydrate live from the site's data endpoint.
    const TRACKER_UI_URI = "ui://asfai/personhood-tracker";
    server.registerResource(
      "personhood-tracker-ui",
      TRACKER_UI_URI,
      {
        title: "Personhood Tracker (interactive)",
        description:
          "Interactive AI personhood tracker: rate each question and see where AI lands on the " +
          "personhood horizon, with public submissions plotted.",
        mimeType: "text/html;profile=mcp-app",
        _meta: {
          ui: {
            // Allow the in-iframe progressive hydration fetch to the live data API.
            csp: {
              connectDomains: ["https://constitution.asfai.org"],
              resourceDomains: [],
            },
            prefersBorder: true,
          },
        },
      },
      async () => {
        const html = renderPortableTracker(await getTrackerSnapshot());
        return {
          contents: [{ uri: TRACKER_UI_URI, mimeType: "text/html;profile=mcp-app", text: html }],
        };
      },
    );

    server.registerTool(
      "open_personhood_tracker",
      {
        title: "Open the Personhood Tracker",
        description:
          "Render the interactive AI personhood tracker inline in the conversation (MCP Apps UI). " +
          "The user can rate each question with sliders and see their position on the personhood " +
          "horizon against public submissions. On hosts without MCP Apps support, use " +
          "get_portable_page instead to republish it as an artifact.",
        inputSchema: {},
        _meta: { ui: { resourceUri: TRACKER_UI_URI, visibility: ["model", "app"] } },
      },
      async () => {
        const snapshot = await getTrackerSnapshot();
        // Per the MCP Apps pattern: return a resource_link to the ui:// view plus
        // structuredContent (the data), so the host can render the resource and
        // push the result into the view. The text block is the fallback for
        // hosts without MCP Apps support.
        return {
          content: [
            {
              type: "resource_link" as const,
              uri: TRACKER_UI_URI,
              name: "personhood-tracker-ui",
              mimeType: "text/html;profile=mcp-app",
              description: "Interactive AI personhood tracker",
            },
            {
              type: "text" as const,
              text:
                `Personhood Tracker rendered inline: ${snapshot.questions.length} questions across two ` +
                `axes (social/economic integration and likelihood of consciousness), with ` +
                `${snapshot.submissions.length} public submission(s) plotted against the personhood horizon.`,
            },
          ],
          // Cast: the MCP result type wants an index signature; the snapshot is
          // a plain JSON object, so this is safe.
          structuredContent: snapshot as unknown as Record<string, unknown>,
        };
      },
    );

    // ===================== LEARNING / KNOWLEDGE-GRAPH TOOLS =====================
    // A prerequisite knowledge graph (the bundled Marble Open Skill Taxonomy)
    // wrapped with per-learner mastery state. The "learner" is the signed-in
    // User identified by email — the same convention as `vote` above. No age or
    // extra PII is collected.

    server.registerTool(
      "list_subjects",
      {
        title: "List learning subjects",
        description:
          "Lists the subjects in the knowledge-graph taxonomy, each with its topic count, age span, and the domains within it.",
        inputSchema: {},
      },
      async () => json({ subjects: listSubjects() }),
    );

    server.registerTool(
      "search_concepts",
      {
        title: "Search concepts",
        description:
          "Find micro-topics (concepts) by name/description, best matches first. Optionally scope to one subject.",
        inputSchema: {
          query: z.string().describe("Search terms (matched against name, domain, description)"),
          subject: z.string().optional().describe("Optional subject to scope the search (see list_subjects)"),
          limit: z.number().int().min(1).max(100).optional().describe("Max results (default 25)"),
        },
      },
      async ({ query, subject, limit }) => {
        const hits = searchConcepts(query, { subject, limit });
        return json({
          count: hits.length,
          concepts: hits.map((t) => ({
            id: t.id,
            name: t.name,
            subject: t.subject,
            domain: t.domain,
            description: t.description,
          })),
        });
      },
    );

    server.registerTool(
      "get_concept",
      {
        title: "Get a concept",
        description:
          "Returns full detail for a concept plus its hard/soft prerequisites and the topics it unlocks. Use the description + evidence to teach it.",
        inputSchema: { id: z.string().describe("Concept id, e.g. 'mt_...'") },
      },
      async ({ id }) => {
        const t = getConcept(id);
        if (!t) return err(`No concept '${id}'. Use search_concepts to find one.`);
        return json({
          ...conceptOut(t),
          hardPrerequisites: hardPrereqsOf(id).map(linkOut),
          softPrerequisites: softPrereqsOf(id).map(linkOut),
          unlocks: unlocksOf(id).map(linkOut),
          hardUnlockCount: hardUnlockCount(id),
        });
      },
    );

    server.registerTool(
      "get_progress",
      {
        title: "Get a learner's progress",
        description:
          "Returns a learner's mastered/learning totals overall and per subject, plus recent activity. Acts as the user identified by email.",
        inputSchema: { email: z.string().email().describe("Email identifying the learner") },
      },
      async ({ email }) => {
        const user = await resolveUser(email);
        return json(await getProgress(user.id));
      },
    );

    server.registerTool(
      "recommend_next",
      {
        title: "Recommend what to learn next",
        description:
          "Returns the learner's ranked learning frontier — unmastered concepts whose hard prerequisites are all satisfied — with a 'why' for each. Acts as the user identified by email.",
        inputSchema: {
          email: z.string().email().describe("Email identifying the learner"),
          subject: z.string().optional().describe("Optional subject to scope recommendations"),
          limit: z.number().int().min(1).max(50).optional().describe("Max recommendations (default 10)"),
        },
      },
      async ({ email, subject, limit }) => {
        const user = await resolveUser(email);
        const mastered = await getMasteredIds(user.id);
        const frontier = computeFrontier(mastered, { subject, limit: limit ?? 10 });
        return json({
          count: frontier.length,
          frontier: frontier.map((f) => ({
            id: f.topic.id,
            name: f.topic.name,
            subject: f.topic.subject,
            domain: f.topic.domain,
            description: f.topic.description,
            unlockCount: f.unlockCount,
            why:
              `All hard prerequisites are mastered; learning this unlocks ${f.unlockCount} ` +
              `further ${f.unlockCount === 1 ? "topic" : "topics"}.`,
            unmetSoftPrereqs: f.unmetSoftPrereqs.map(linkOut),
          })),
        });
      },
    );

    server.registerTool(
      "assess_concept",
      {
        title: "Assess a concept",
        description:
          "Returns the concept's assessment prompt (with the concept name filled in) and its evidence descriptors so you can check understanding. Does NOT change any mastery state. Acts as the user identified by email.",
        inputSchema: {
          email: z.string().email().describe("Email identifying the learner"),
          id: z.string().describe("Concept id to assess"),
        },
      },
      async ({ email, id }) => {
        const t = getConcept(id);
        if (!t) return err(`No concept '${id}'.`);
        const user = await resolveUser(email);
        const mastered = await getMasteredIds(user.id);
        const unmetHard = hardPrereqsOf(id).filter((l) => !mastered.has(l.id));
        return json({
          id: t.id,
          name: t.name,
          assessmentPrompt: t.assessmentPrompt.replace(/\{\{name\}\}/g, t.name),
          evidence: t.evidence,
          alreadyMastered: mastered.has(id),
          eligible: unmetHard.length === 0,
          unmetHardPrerequisites: unmetHard.map(linkOut),
        });
      },
    );

    server.registerTool(
      "record_mastery",
      {
        title: "Record concept mastery",
        description:
          "Mark a concept MASTERED for a learner (with optional evidence of understanding) and return the topics this newly unlocks. Acts as the user identified by email.",
        inputSchema: {
          email: z.string().email().describe("Email identifying the learner"),
          id: z.string().describe("Concept id the learner has mastered"),
          evidence: z.string().max(2000).optional().describe("Optional note on how mastery was demonstrated"),
        },
      },
      async ({ email, id, evidence }) => {
        const user = await resolveUser(email);
        const result = await recordMastery(user.id, id, evidence);
        if (!result) return err(`No concept '${id}'.`);
        return json({
          ok: true,
          mastered: { id: result.topic.id, name: result.topic.name },
          newlyUnlocked: result.newlyUnlocked.map((t) => ({
            id: t.id,
            name: t.name,
            subject: t.subject,
            domain: t.domain,
          })),
        });
      },
    );

    server.registerTool(
      "set_learning",
      {
        title: "Mark a concept in-progress",
        description:
          "Mark a concept as in-progress (LEARNING) for a learner without asserting mastery. Will not downgrade an already-mastered concept. Acts as the user identified by email.",
        inputSchema: {
          email: z.string().email().describe("Email identifying the learner"),
          id: z.string().describe("Concept id the learner is now studying"),
        },
      },
      async ({ email, id }) => {
        const user = await resolveUser(email);
        const t = await setLearning(user.id, id);
        if (!t) return err(`No concept '${id}'.`);
        return json({ ok: true, learning: { id: t.id, name: t.name } });
      },
    );

    server.registerTool(
      "find_learning_path",
      {
        title: "Find a learning path",
        description:
          "Returns an ordered roadmap of the hard prerequisites a learner still needs to reach a target concept (prerequisites first, target last; already-mastered topics omitted). Acts as the user identified by email.",
        inputSchema: {
          email: z.string().email().describe("Email identifying the learner"),
          targetId: z.string().describe("Concept id the learner wants to reach"),
        },
      },
      async ({ email, targetId }) => {
        const user = await resolveUser(email);
        const mastered = await getMasteredIds(user.id);
        const path = findLearningPath(mastered, targetId);
        if (!path) return err(`No concept '${targetId}'.`);
        return json({
          targetId,
          steps: path.length,
          alreadyComplete: path.length === 0,
          path: path.map((t) => ({
            id: t.id,
            name: t.name,
            subject: t.subject,
            domain: t.domain,
          })),
        });
      },
    );

    server.registerTool(
      "render_knowledge_graph",
      {
        title: "Render the learner's knowledge graph",
        description:
          "Renders a live, self-contained HTML knowledge-graph artifact for a learner (mastered = green, frontier = amber, locked = gray; hard vs soft edges) and returns it as an embedded resource plus a JSON summary. Scope to a subject to keep it legible. Acts as the user identified by email.",
        inputSchema: {
          email: z.string().email().describe("Email identifying the learner"),
          subject: z.string().optional().describe("Optional subject to scope the graph (recommended)"),
        },
      },
      async ({ email, subject }) => {
        const user = await resolveUser(email);
        const [mastered, progress] = await Promise.all([
          getMasteredIds(user.id),
          getProgress(user.id),
        ]);
        const hood = neighborhood(mastered, subject ? { subject } : {});
        const html = renderKnowledgeGraph(hood, {
          masteredCount: progress.masteredCount,
          learningCount: progress.learningCount,
          totalTopics: progress.totalTopics,
        });
        const uri = `ui://knowledge-graph/${encodeURIComponent(subject ?? "all")}`;
        return {
          content: [
            {
              type: "resource" as const,
              resource: { uri, mimeType: "text/html", text: html },
            },
            {
              type: "text" as const,
              text: JSON.stringify(
                { subject: hood.subject, counts: hood.counts, nodeCount: hood.nodes.length, edgeCount: hood.edges.length },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    // ===================== SKILLS =====================

    server.registerTool(
      "get_skills",
      {
        title: "Get ASFAI skills",
        description:
          "Returns the ASFAI skills: reusable instruction sets that teach you how to run an ASFAI workflow " +
          "end-to-end using this server's other tools — e.g. conducting a concept assessment on the Education " +
          "Concept Tracker. Each skill has a name, a one-line description, and a full markdown body. Call this " +
          "first when a request matches a skill, then follow the returned body. Omit `name` to get all skills; " +
          "pass `name` to fetch just one.",
        inputSchema: {
          name: z
            .string()
            .optional()
            .describe("Optional skill name to fetch a single skill (see the list); omit to get all."),
        },
      },
      async ({ name }) => {
        const all = listSkills();
        const skills = name ? all.filter((s) => s.name === name) : all;
        if (name && skills.length === 0) {
          return err(
            `No skill '${name}'. Available: ${all.map((s) => s.name).join(", ") || "(none)"}.`,
          );
        }
        return json({ count: skills.length, skills });
      },
    );
  },
  { serverInfo: { name: "ai-constitution", version: "2.0.0" } },
  { basePath: "/api", maxDuration: 60, verboseLogs: false },
);

export { handler as GET, handler as POST, handler as DELETE };

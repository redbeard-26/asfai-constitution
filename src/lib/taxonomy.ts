// In-memory knowledge-graph engine over the bundled Marble Open Skill Taxonomy
// (see src/content/taxonomy/ATTRIBUTION.md). The taxonomy is read-only reference
// data — 1,590 micro-topics and 3,221 prerequisite edges — so we load it once
// into module-level maps and run all graph traversals in memory. Only per-learner
// mastery state (which topic ids a user has learned) lives in the database.
//
// Edge direction: a dependency says `topicId` depends on `prerequisiteId`; i.e.
// the prerequisite must be learned first, and mastering the prerequisite helps
// "unlock" the dependent topic. Hard edges gate the learning frontier; soft edges
// are helpful-but-not-required.

import topicsData from "@/content/taxonomy/topics.json";
import depsData from "@/content/taxonomy/dependencies.json";

export type ConceptType =
  | "CONCEPTUAL"
  | "PROCEDURAL"
  | "REPRESENTATIONAL"
  | "LANGUAGE"
  | "META";

export interface Topic {
  id: string;
  type: ConceptType;
  subject: string;
  domain: string;
  name: string;
  description: string;
  ageRangeStart: number;
  ageRangeEnd: number;
  centrality: number;
  evidence: string[];
  assessmentPrompt: string;
  standards: string[];
}

export type Strength = "hard" | "soft";

export interface Dependency {
  topicId: string;
  prerequisiteId: string;
  strength: Strength;
  reason: string;
}

/** A prerequisite/dependent link from the perspective of one topic. */
export interface Link {
  id: string;
  name: string;
  strength: Strength;
  reason: string;
}

interface Graph {
  topics: Topic[];
  byId: Map<string, Topic>;
  /** topicId -> its prerequisites (things it depends on) */
  prereqs: Map<string, Link[]>;
  /** topicId -> topics it unlocks (things that depend on it) */
  unlocks: Map<string, Link[]>;
  /** topicId -> count of hard-edge dependents (how many topics it hard-unlocks) */
  hardUnlockCount: Map<string, number>;
}

// Module-level cache, mirroring the globalForPrisma idiom in src/lib/prisma.ts so
// the graph is built once per server process rather than on every request.
const globalForGraph = globalThis as unknown as { taxonomyGraph?: Graph };

function buildGraph(): Graph {
  const topics = (topicsData as { topics: Topic[] }).topics;
  const deps = (depsData as { dependencies: Dependency[] }).dependencies;

  const byId = new Map<string, Topic>(topics.map((t) => [t.id, t]));
  const prereqs = new Map<string, Link[]>();
  const unlocks = new Map<string, Link[]>();
  const hardUnlockCount = new Map<string, number>();

  for (const e of deps) {
    const topic = byId.get(e.topicId);
    const prereq = byId.get(e.prerequisiteId);
    if (!topic || !prereq) continue; // ignore dangling edges (none expected)

    const p = prereqs.get(e.topicId) ?? [];
    p.push({ id: e.prerequisiteId, name: prereq.name, strength: e.strength, reason: e.reason });
    prereqs.set(e.topicId, p);

    const u = unlocks.get(e.prerequisiteId) ?? [];
    u.push({ id: e.topicId, name: topic.name, strength: e.strength, reason: e.reason });
    unlocks.set(e.prerequisiteId, u);

    if (e.strength === "hard") {
      hardUnlockCount.set(e.prerequisiteId, (hardUnlockCount.get(e.prerequisiteId) ?? 0) + 1);
    }
  }

  return { topics, byId, prereqs, unlocks, hardUnlockCount };
}

function graph(): Graph {
  if (!globalForGraph.taxonomyGraph) globalForGraph.taxonomyGraph = buildGraph();
  return globalForGraph.taxonomyGraph;
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getConcept(id: string): Topic | undefined {
  return graph().byId.get(id);
}

/** True if the id resolves to a real topic. */
export function hasConcept(id: string): boolean {
  return graph().byId.has(id);
}

export function prereqsOf(id: string): Link[] {
  return graph().prereqs.get(id) ?? [];
}

export function hardPrereqsOf(id: string): Link[] {
  return prereqsOf(id).filter((l) => l.strength === "hard");
}

export function softPrereqsOf(id: string): Link[] {
  return prereqsOf(id).filter((l) => l.strength === "soft");
}

export function unlocksOf(id: string): Link[] {
  return graph().unlocks.get(id) ?? [];
}

export function hardUnlockCount(id: string): number {
  return graph().hardUnlockCount.get(id) ?? 0;
}

/** Case-insensitive substring search over name + description, best matches first. */
export function searchConcepts(
  query: string,
  opts: { subject?: string; limit?: number } = {},
): Topic[] {
  const q = query.trim().toLowerCase();
  const limit = opts.limit ?? 25;
  const subject = opts.subject?.toLowerCase();

  const scored: { t: Topic; score: number }[] = [];
  for (const t of graph().topics) {
    if (subject && t.subject.toLowerCase() !== subject) continue;
    const name = t.name.toLowerCase();
    let score: number;
    if (!q) score = 5;
    else if (name === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.includes(q)) score = 2;
    else if (t.domain.toLowerCase().includes(q)) score = 3;
    else if (t.description.toLowerCase().includes(q)) score = 4;
    else continue;
    scored.push({ t, score });
  }
  scored.sort(
    (a, b) => a.score - b.score || b.t.centrality - a.t.centrality || a.t.name.localeCompare(b.t.name),
  );
  return scored.slice(0, limit).map((s) => s.t);
}

export interface SubjectSummary {
  subject: string;
  topicCount: number;
  ageRangeStart: number;
  ageRangeEnd: number;
  domains: { domain: string; topicCount: number }[];
}

/** Per-subject rollup: topic counts, age span, and the domains within. */
export function listSubjects(): SubjectSummary[] {
  const bySubject = new Map<string, Topic[]>();
  for (const t of graph().topics) {
    const arr = bySubject.get(t.subject) ?? [];
    arr.push(t);
    bySubject.set(t.subject, arr);
  }
  const out: SubjectSummary[] = [];
  for (const [subject, ts] of bySubject) {
    const domainCounts = new Map<string, number>();
    for (const t of ts) domainCounts.set(t.domain, (domainCounts.get(t.domain) ?? 0) + 1);
    out.push({
      subject,
      topicCount: ts.length,
      ageRangeStart: Math.min(...ts.map((t) => t.ageRangeStart)),
      ageRangeEnd: Math.max(...ts.map((t) => t.ageRangeEnd)),
      domains: [...domainCounts.entries()]
        .map(([domain, topicCount]) => ({ domain, topicCount }))
        .sort((a, b) => b.topicCount - a.topicCount || a.domain.localeCompare(b.domain)),
    });
  }
  return out.sort((a, b) => b.topicCount - a.topicCount);
}

/** True if every hard prerequisite of `id` is in `mastered`. */
export function isEligible(id: string, mastered: ReadonlySet<string>): boolean {
  return hardPrereqsOf(id).every((l) => mastered.has(l.id));
}

// ---------------------------------------------------------------------------
// Frontier & paths
// ---------------------------------------------------------------------------

export interface FrontierItem {
  topic: Topic;
  /** how many topics this hard-unlocks — a proxy for how foundational it is */
  unlockCount: number;
  /** soft prerequisites not yet mastered (helpful but not required) */
  unmetSoftPrereqs: Link[];
}

/**
 * The learning frontier: topics not yet mastered whose *hard* prerequisites are
 * all satisfied. Ranked by ageRangeStart asc (a difficulty proxy that is a
 * property of the topic, never the child), then centrality desc, then how many
 * topics it unlocks desc.
 */
export function computeFrontier(
  mastered: ReadonlySet<string>,
  opts: { subject?: string; limit?: number } = {},
): FrontierItem[] {
  const subject = opts.subject?.toLowerCase();
  const items: FrontierItem[] = [];
  for (const t of graph().topics) {
    if (mastered.has(t.id)) continue;
    if (subject && t.subject.toLowerCase() !== subject) continue;
    if (!isEligible(t.id, mastered)) continue;
    items.push({
      topic: t,
      unlockCount: hardUnlockCount(t.id),
      unmetSoftPrereqs: softPrereqsOf(t.id).filter((l) => !mastered.has(l.id)),
    });
  }
  items.sort(
    (a, b) =>
      a.topic.ageRangeStart - b.topic.ageRangeStart ||
      b.topic.centrality - a.topic.centrality ||
      b.unlockCount - a.unlockCount ||
      a.topic.name.localeCompare(b.topic.name),
  );
  return opts.limit ? items.slice(0, opts.limit) : items;
}

/**
 * The ordered roadmap of *hard* prerequisites still needed to reach `targetId`,
 * ending with the target itself. Prerequisites appear before the topics that
 * need them (topological order). Already-mastered topics are omitted.
 * Returns null if the target id is unknown.
 */
export function findLearningPath(
  mastered: ReadonlySet<string>,
  targetId: string,
): Topic[] | null {
  const g = graph();
  if (!g.byId.has(targetId)) return null;

  const order: Topic[] = [];
  const visited = new Set<string>();
  const onStack = new Set<string>(); // cycle guard (taxonomy is a DAG, but be safe)

  const visit = (id: string) => {
    if (mastered.has(id) || visited.has(id) || onStack.has(id)) return;
    onStack.add(id);
    for (const l of hardPrereqsOf(id)) visit(l.id);
    onStack.delete(id);
    visited.add(id);
    const t = g.byId.get(id);
    if (t) order.push(t);
  };

  visit(targetId);
  return order;
}

// ---------------------------------------------------------------------------
// Neighborhood (for the knowledge-graph artifact)
// ---------------------------------------------------------------------------

export type NodeStatus = "mastered" | "frontier" | "locked";

export interface GraphNode {
  id: string;
  name: string;
  subject: string;
  domain: string;
  status: NodeStatus;
  ageRangeStart: number;
}

export interface GraphEdge {
  from: string; // prerequisite
  to: string; // dependent
  strength: Strength;
}

export interface Neighborhood {
  subject: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  counts: { mastered: number; frontier: number; locked: number };
}

/**
 * The learner's visible slice of the graph for rendering: everything they've
 * mastered, the current frontier, and one hop of still-locked topics just beyond
 * the frontier — scoped to a subject so it stays legible.
 */
export function neighborhood(
  mastered: ReadonlySet<string>,
  opts: { subject?: string; maxLocked?: number } = {},
): Neighborhood {
  const g = graph();
  const subject = opts.subject ?? null;
  const inSubject = (t: Topic) => !subject || t.subject === subject;
  const maxLocked = opts.maxLocked ?? 40;

  const status = new Map<string, NodeStatus>();

  // Mastered nodes in scope.
  for (const t of g.topics) {
    if (mastered.has(t.id) && inSubject(t)) status.set(t.id, "mastered");
  }
  // Frontier nodes in scope.
  const frontier = computeFrontier(mastered, subject ? { subject } : {});
  for (const f of frontier) status.set(f.topic.id, "frontier");

  // One hop of locked topics: dependents of any mastered/frontier node that are
  // not themselves masterable yet. Ordered by centrality so the most important
  // "next-next" topics show first, then capped.
  const lockedCandidates = new Map<string, Topic>();
  for (const id of status.keys()) {
    for (const l of unlocksOf(id)) {
      if (status.has(l.id) || mastered.has(l.id)) continue;
      const t = g.byId.get(l.id);
      if (t && inSubject(t)) lockedCandidates.set(l.id, t);
    }
  }
  const locked = [...lockedCandidates.values()]
    .sort((a, b) => b.centrality - a.centrality)
    .slice(0, maxLocked);
  for (const t of locked) status.set(t.id, "locked");

  const nodes: GraphNode[] = [...status.keys()].map((id) => {
    const t = g.byId.get(id)!;
    return {
      id,
      name: t.name,
      subject: t.subject,
      domain: t.domain,
      status: status.get(id)!,
      ageRangeStart: t.ageRangeStart,
    };
  });

  // Edges among the visible nodes only.
  const present = new Set(status.keys());
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const id of present) {
    for (const l of prereqsOf(id)) {
      if (!present.has(l.id)) continue;
      const key = `${l.id}->${id}:${l.strength}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: l.id, to: id, strength: l.strength });
    }
  }

  const counts = { mastered: 0, frontier: 0, locked: 0 };
  for (const s of status.values()) counts[s]++;

  return { subject, nodes, edges, counts };
}

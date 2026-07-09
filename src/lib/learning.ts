// Per-learner mastery data access for the knowledge-graph tutor. Composes the
// in-memory taxonomy graph (src/lib/taxonomy.ts) with the ConceptMastery rows a
// learner accumulates. Follows the conventions in src/lib/data.ts. The "learner"
// is simply the signed-in User; we store no age or extra PII.

import { prisma } from "@/lib/prisma";
import {
  getConcept,
  listSubjects,
  hasConcept,
  type Topic,
} from "@/lib/taxonomy";

export type MasteryStatus = "LEARNING" | "MASTERED";

/** Set of topic ids a user has MASTERED — the input to every graph traversal. */
export async function getMasteredIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.conceptMastery.findMany({
    where: { userId, status: "MASTERED" },
    select: { topicId: true },
  });
  return new Set(rows.map((r) => r.topicId));
}

/** All mastery rows for a user (both LEARNING and MASTERED). */
export async function getMasteryRows(userId: string) {
  return prisma.conceptMastery.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export interface ProgressSummary {
  masteredCount: number;
  learningCount: number;
  totalTopics: number;
  bySubject: {
    subject: string;
    mastered: number;
    learning: number;
    totalTopics: number;
  }[];
  recent: { topicId: string; name: string | null; status: MasteryStatus; updatedAt: Date }[];
}

/** Mastered/learning rollups overall and per subject, plus recent activity. */
export async function getProgress(userId: string): Promise<ProgressSummary> {
  const rows = await prisma.conceptMastery.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  const subjects = listSubjects();
  const totalTopics = subjects.reduce((s, x) => s + x.topicCount, 0);

  const counts = new Map<string, { mastered: number; learning: number }>();
  let masteredCount = 0;
  let learningCount = 0;
  for (const r of rows) {
    const t = getConcept(r.topicId);
    const subject = t?.subject ?? "Unknown";
    const c = counts.get(subject) ?? { mastered: 0, learning: 0 };
    if (r.status === "MASTERED") {
      c.mastered++;
      masteredCount++;
    } else {
      c.learning++;
      learningCount++;
    }
    counts.set(subject, c);
  }

  const bySubject = subjects
    .map((s) => ({
      subject: s.subject,
      mastered: counts.get(s.subject)?.mastered ?? 0,
      learning: counts.get(s.subject)?.learning ?? 0,
      totalTopics: s.topicCount,
    }))
    .filter((s) => s.mastered > 0 || s.learning > 0)
    .sort((a, b) => b.mastered - a.mastered || b.learning - a.learning);

  const recent = rows.slice(0, 10).map((r) => ({
    topicId: r.topicId,
    name: getConcept(r.topicId)?.name ?? null,
    status: r.status as MasteryStatus,
    updatedAt: r.updatedAt,
  }));

  return { masteredCount, learningCount, totalTopics, bySubject, recent };
}

/**
 * Mark a concept MASTERED for a learner (idempotent upsert). Returns the topic
 * plus the topics this newly unlocks — i.e. dependents that just became eligible
 * (all their hard prerequisites are now mastered) and were not eligible before.
 * Returns null if the topic id is unknown.
 */
export async function recordMastery(
  userId: string,
  topicId: string,
  evidence?: string,
): Promise<{ topic: Topic; newlyUnlocked: Topic[] } | null> {
  const topic = getConcept(topicId);
  if (!topic) return null;

  const before = await getMasteredIds(userId);

  await prisma.conceptMastery.upsert({
    where: { userId_topicId: { userId, topicId } },
    update: { status: "MASTERED", evidence: evidence ?? undefined, assessedAt: new Date() },
    create: { userId, topicId, status: "MASTERED", evidence, assessedAt: new Date() },
  });

  // Lazy import to avoid a top-level cycle and keep this list-building local.
  const { unlocksOf, hardPrereqsOf } = await import("@/lib/taxonomy");
  const after = new Set(before);
  after.add(topicId);

  const newlyUnlocked: Topic[] = [];
  for (const l of unlocksOf(topicId)) {
    if (after.has(l.id)) continue;
    const wasEligible = hardPrereqsOf(l.id).every((p) => before.has(p.id));
    const isEligibleNow = hardPrereqsOf(l.id).every((p) => after.has(p.id));
    if (!wasEligible && isEligibleNow) {
      const t = getConcept(l.id);
      if (t) newlyUnlocked.push(t);
    }
  }
  newlyUnlocked.sort((a, b) => a.ageRangeStart - b.ageRangeStart || b.centrality - a.centrality);

  return { topic, newlyUnlocked };
}

/**
 * Mark a concept as in-progress (LEARNING) for a learner, without asserting
 * mastery. No-op-safe upsert; will not downgrade an already-MASTERED row.
 * Returns null if the topic id is unknown.
 */
export async function setLearning(
  userId: string,
  topicId: string,
): Promise<Topic | null> {
  if (!hasConcept(topicId)) return null;
  const existing = await prisma.conceptMastery.findUnique({
    where: { userId_topicId: { userId, topicId } },
    select: { status: true },
  });
  if (existing?.status !== "MASTERED") {
    await prisma.conceptMastery.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: { status: "LEARNING" },
      create: { userId, topicId, status: "LEARNING" },
    });
  }
  return getConcept(topicId) ?? null;
}

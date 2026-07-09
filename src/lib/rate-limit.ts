import { prisma } from "@/lib/prisma";

type RateWindow = { windowMs: number; max: number; label: string };

/**
 * Database-backed rate limit: counts how many rows the author created within
 * the window and throws if the limit is reached. Works on serverless/multi-
 * instance Vercel without an external store, since it queries Postgres.
 */
export async function checkRateLimit(
  model: "comment" | "editProposal" | "trackerSubmission",
  authorId: string,
  { windowMs, max, label }: RateWindow,
): Promise<void> {
  const since = new Date(Date.now() - windowMs);
  const createdAt = { gte: since };
  let count: number;
  if (model === "comment") {
    count = await prisma.comment.count({ where: { authorId, createdAt } });
  } else if (model === "editProposal") {
    count = await prisma.editProposal.count({ where: { authorId, createdAt } });
  } else {
    // TrackerSubmission keys the author as userId rather than authorId.
    count = await prisma.trackerSubmission.count({ where: { userId: authorId, createdAt } });
  }

  if (count >= max) {
    const mins = Math.max(1, Math.round(windowMs / 60000));
    throw new Error(
      `Rate limit reached: at most ${max} ${label} per ${mins} minute${
        mins === 1 ? "" : "s"
      }. Please wait a little before trying again.`,
    );
  }
}

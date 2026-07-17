// One-time backfill: after adding TrackerSubmission.x/y (previously coordinates
// were computed on read), stamp each existing submission's stored x/y from its
// responses so it keeps its plot position. Safe to re-run (idempotent).
//
// Run once, after `npm run db:push`:
//   npx tsx scripts/backfill-tracker-coords.ts
//
// Uses the direct (non-pooled) connection to avoid the pooled URL's
// channel_binding requirement.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { axisScores } from "../src/lib/tracker";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const questions = await prisma.trackerQuestion.findMany({
    select: { key: true, category: true },
  });
  const subs = await prisma.trackerSubmission.findMany({
    select: { id: true, name: true, responses: { select: { questionKey: true, rating: true } } },
  });
  let updated = 0;
  for (const s of subs) {
    const answers: Record<string, number> = {};
    for (const r of s.responses) answers[r.questionKey] = r.rating;
    const { x, y } = axisScores(answers, questions);
    await prisma.trackerSubmission.update({ where: { id: s.id }, data: { x, y } });
    console.log(`  ${s.name}: x=${x} y=${y}`);
    updated++;
  }
  console.log(`Backfilled ${updated} submission(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

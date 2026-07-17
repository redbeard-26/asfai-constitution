// Portable Personhood Tracker — assembles the self-contained single-file HTML
// artifact (see src/content/portable/personhood-tracker.html) by injecting a
// live data snapshot into the template's JSON data island. The same snapshot
// shape is served raw at /api/personhood-tracker.json for progressive
// hydration. Served by the /personhood-tracker/artifact.html route and the MCP
// `get_portable_page` tool. The template is bundled into those serverless
// functions via `outputFileTracingIncludes` in next.config.ts.

import fs from "node:fs";
import path from "node:path";
import { getPersonhoodTracker } from "@/lib/data";
import { horizonDistance } from "@/lib/tracker";

export interface TrackerSnapshot {
  generatedAt: string; // YYYY-MM-DD
  source: string;
  horizon: { notJustifiedBelow: number; horizonAt: number };
  questions: { key: string; category: string; question: string; explanation: string }[];
  submissions: {
    name: string;
    by: string;
    x: number;
    y: number;
    distance: number;
    createdAt: string;
    answers: Record<string, number>;
  }[];
}

/** Current tracker data in the portable/hydration shape (questions flat,
 *  submissions with `by`), shared by the JSON endpoint and the artifact. */
export async function getTrackerSnapshot(): Promise<TrackerSnapshot> {
  const { questions, submissions } = await getPersonhoodTracker();
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: "https://constitution.asfai.org/personhood-tracker",
    horizon: { notJustifiedBelow: 50, horizonAt: 100 },
    questions: [...questions.social, ...questions.consciousness].map((q) => ({
      key: q.key,
      category: q.category,
      question: q.question,
      explanation: q.explanation,
    })),
    submissions: submissions.map((s) => ({
      name: s.name,
      by: s.userName,
      x: s.x,
      y: s.y,
      distance: horizonDistance(s.x, s.y),
      createdAt: s.createdAt,
      answers: s.answers,
    })),
  };
}

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "src",
  "content",
  "portable",
  "personhood-tracker.html",
);
const globalForPortable = globalThis as unknown as { portableTrackerTemplate?: string };

function template(): string {
  if (!globalForPortable.portableTrackerTemplate) {
    globalForPortable.portableTrackerTemplate = fs.readFileSync(TEMPLATE_PATH, "utf8");
  }
  return globalForPortable.portableTrackerTemplate;
}

/** The complete portable HTML page with `snapshot` embedded in the data island.
 *  Escapes `<` so the JSON can't break out of the <script> element, and uses a
 *  function replacer so `$`-sequences in the data are inserted literally. */
export function renderPortableTracker(snapshot: TrackerSnapshot): string {
  const island = JSON.stringify(snapshot, null, 2).replace(/</g, "\\u003c");
  return template().replace("__PAGE_DATA__", () => island);
}

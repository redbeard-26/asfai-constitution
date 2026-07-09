// Shared, dependency-free helpers for the Personhood Tracker. Imported by both
// the server (data layer + actions) and the client component so the axis math
// and plot geometry have a single source of truth.

export type TrackerAxis = "SOCIAL" | "CONSCIOUSNESS";

/** Quadratic (RMS) mean of a set of 0-100 ratings, rounded to an integer. */
export function rms(ratings: number[]): number {
  if (!ratings.length) return 0;
  const sum = ratings.reduce((s, r) => s + r * r, 0);
  return Math.round(Math.sqrt(sum / ratings.length));
}

/** Axis scores (x = social, y = consciousness) for a set of per-question
 *  answers, using the RMS of each category's ratings. Missing answers count as 0. */
export function axisScores(
  answers: Record<string, number>,
  questions: { key: string; category: string }[],
): { x: number; y: number } {
  const forCategory = (category: TrackerAxis) =>
    questions.filter((q) => q.category === category).map((q) => answers[q.key] ?? 0);
  return { x: rms(forCategory("SOCIAL")), y: rms(forCategory("CONSCIOUSNESS")) };
}

// ---------------------------------------------------------------------------
// Plot geometry — maps data values (0-100) to SVG pixels. Origin bottom-left,
// square scale; the "personhood horizon" is the quarter-circle x² + y² = 100².
// ---------------------------------------------------------------------------

export const PLOT = {
  viewBox: "0 0 500 470",
  /** data x (0-100) → svg x */
  px: (v: number) => 70 + v * 3.6,
  /** data y (0-100) → svg y */
  py: (v: number) => 400 - v * 3.6,
} as const;

/** Straight-line distance from the origin; the horizon sits at 100. */
export function horizonDistance(x: number, y: number): number {
  return Math.round(Math.sqrt(x * x + y * y));
}

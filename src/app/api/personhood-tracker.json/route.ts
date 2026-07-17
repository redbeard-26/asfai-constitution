// Public, open-CORS data endpoint that backs both the site and every ported
// copy of the portable Personhood Tracker (progressive hydration). Returns the
// same shape embedded in the artifact's data island. Read-only public data —
// CORS is wide open so artifact sandboxes and file:// (null) origins can fetch.

import { getTrackerSnapshot } from "@/lib/portable-tracker";

export const dynamic = "force-dynamic"; // always reflect current submissions

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  const snapshot = await getTrackerSnapshot();
  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      ...CORS,
    },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

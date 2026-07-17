// Portable, self-contained export of the Personhood Tracker — one HTML file
// with an embedded data snapshot that also hydrates live. Designed for AI
// agents to fetch and re-host losslessly (see the "portable page" pattern).
// Discoverable via <link rel="alternate"> on the tracker page, /llms.txt, and
// the MCP `get_portable_page` tool. CORS is open so agents can fetch the file
// itself cross-origin.

import { getTrackerSnapshot, renderPortableTracker } from "@/lib/portable-tracker";

export const dynamic = "force-dynamic"; // embed a fresh snapshot each request

export async function GET() {
  const html = renderPortableTracker(await getTrackerSnapshot());
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

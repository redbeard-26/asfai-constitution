// Serves an ASFAI skill as a downloadable `.skill` bundle (a zip rooted at the
// skill folder). The install_asfai_skills MCP tool hands out these URLs; the
// client downloads and unzips into ~/.claude/skills/. Public, open CORS.

import { buildSkillBundle } from "@/lib/skill-bundle";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  const name = skill.replace(/\.(skill|zip)$/, "");
  const zip = buildSkillBundle(name);
  if (!zip) {
    return new Response(`Unknown skill '${name}'.`, {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
  // Copy into a fresh ArrayBuffer so the body is a clean BodyInit.
  const body = zip.slice();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name}.skill"`,
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

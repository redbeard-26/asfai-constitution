import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle runtime-read content files into the serverless functions that need
  // them. The MCP route reads skill markdown (get_skills) and the portable
  // tracker template (get_portable_page); the artifact route renders the same
  // template. src/lib/skills.ts and src/lib/portable-tracker.ts read these at
  // runtime via fs, so they must be traced into each function's bundle.
  outputFileTracingIncludes: {
    // All skill folder files (SKILL.md + assets + VERSION) so get_skills,
    // install_asfai_skills, and the /api/skills/<name> zip route can read them.
    // `**` so it also reaches the nested /api/skills/[skill] function.
    "/api/**": [
      "src/content/skills/**/*",
      "src/content/portable/**/*.html",
    ],
    "/personhood-tracker/artifact.html": ["src/content/portable/**/*.html"],
  },
};

export default nextConfig;

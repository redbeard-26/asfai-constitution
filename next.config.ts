import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle runtime-read content files into the serverless functions that need
  // them. The MCP route reads skill markdown (get_skills) and the portable
  // tracker template (get_portable_page); the artifact route renders the same
  // template. src/lib/skills.ts and src/lib/portable-tracker.ts read these at
  // runtime via fs, so they must be traced into each function's bundle.
  outputFileTracingIncludes: {
    "/api/*": [
      "src/content/skills/**/*.md",
      "src/content/portable/**/*.html",
    ],
    "/personhood-tracker/artifact.html": ["src/content/portable/**/*.html"],
  },
};

export default nextConfig;

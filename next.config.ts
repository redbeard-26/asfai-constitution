import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the ASFAI skill markdown into the MCP route's serverless function so
  // src/lib/skills.ts can read them at runtime (see get_skills tool).
  outputFileTracingIncludes: {
    "/api/*": ["src/content/skills/**/*.md"],
  },
};

export default nextConfig;

// Loader for ASFAI skills — reusable instruction sets (SKILL.md files) that teach
// an AI assistant how to run an ASFAI workflow. Authored as markdown with YAML
// frontmatter in src/content/skills/, loaded once per server process and served
// over the MCP `get_skills` tool. The .md files are bundled into the serverless
// function via `outputFileTracingIncludes` in next.config.ts.

import fs from "node:fs";
import path from "node:path";

export interface Skill {
  /** kebab-case identifier from frontmatter (or the filename). */
  name: string;
  /** One-line summary — used to decide which skill is relevant. */
  description: string;
  /** Full markdown body (frontmatter stripped). */
  body: string;
}

const globalForSkills = globalThis as unknown as { asfaiSkills?: Skill[] };

const SKILLS_DIR = path.join(process.cwd(), "src", "content", "skills");

/** Minimal YAML-frontmatter parse: `--- name: … / description: … ---` then body. */
function parseSkill(raw: string, fallbackName: string): Skill {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { name: fallbackName, description: "", body: raw.trim() };
  const [, frontmatter, body] = m;
  const field = (key: string): string => {
    const line = frontmatter
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${key}:`));
    return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
  };
  return {
    name: field("name") || fallbackName,
    description: field("description"),
    body: body.trim(),
  };
}

function loadSkills(): Skill[] {
  let files: string[];
  try {
    files = fs.readdirSync(SKILLS_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return []; // directory missing (e.g. untraced) — serve nothing rather than throw
  }
  return files
    .map((f) => parseSkill(fs.readFileSync(path.join(SKILLS_DIR, f), "utf8"), f.replace(/\.md$/, "")))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** All ASFAI skills, cached for the process lifetime. */
export function listSkills(): Skill[] {
  if (!globalForSkills.asfaiSkills) globalForSkills.asfaiSkills = loadSkills();
  return globalForSkills.asfaiSkills;
}

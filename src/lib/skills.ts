// Loader for ASFAI skills — reusable instruction sets that teach an AI assistant
// how to run an ASFAI workflow. Each skill is a FOLDER under src/content/skills/
// containing a SKILL.md (markdown + YAML frontmatter), an optional VERSION file,
// and any asset files (e.g. a self-contained HTML page). Loaded once per server
// process. `get_skills` serves the SKILL.md text; `install_asfai_skills` +
// /api/skills/<name> ship the whole folder (assets included) as a .skill zip.
// The folders are bundled into the serverless functions via
// `outputFileTracingIncludes` in next.config.ts.

import fs from "node:fs";
import path from "node:path";

export interface Skill {
  /** kebab-case identifier from frontmatter (or the folder name). */
  name: string;
  /** One-line summary — used to decide which skill is relevant. */
  description: string;
  /** Full SKILL.md body (frontmatter stripped). */
  body: string;
  /** Integer version from the VERSION file (defaults to 1). */
  version: number;
  /** Asset file paths relative to the skill folder (SKILL.md first), for bundling. */
  files: string[];
}

const globalForSkills = globalThis as unknown as { asfaiSkills?: Skill[] };

export const SKILLS_DIR = path.join(process.cwd(), "src", "content", "skills");

/** Minimal YAML-frontmatter parse: `--- name: … / description: … ---` then body. */
function parseFrontmatter(raw: string, fallbackName: string): { name: string; description: string; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { name: fallbackName, description: "", body: raw.trim() };
  const [, frontmatter, body] = m;
  const field = (key: string): string => {
    const line = frontmatter.split(/\r?\n/).find((l) => l.startsWith(`${key}:`));
    return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
  };
  return { name: field("name") || fallbackName, description: field("description"), body: body.trim() };
}

/** All file paths under `dir`, relative to it, using forward slashes. */
function listFiles(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listFiles(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

function loadSkills(): Skill[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  } catch {
    return []; // directory missing (e.g. untraced) — serve nothing rather than throw
  }
  const skills: Skill[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue; // skills are folders now
    const dir = path.join(SKILLS_DIR, entry.name);
    const skillMd = path.join(dir, "SKILL.md");
    if (!fs.existsSync(skillMd)) continue;
    const { name, description, body } = parseFrontmatter(fs.readFileSync(skillMd, "utf8"), entry.name);
    let version = 1;
    try {
      const v = parseInt(fs.readFileSync(path.join(dir, "VERSION"), "utf8").trim(), 10);
      if (Number.isFinite(v) && v > 0) version = v;
    } catch {
      // no VERSION file — default 1
    }
    // SKILL.md first, then the rest (deterministic order for stable zips).
    const files = listFiles(dir).sort((a, b) => (a === "SKILL.md" ? -1 : b === "SKILL.md" ? 1 : a.localeCompare(b)));
    skills.push({ name, description, body, version, files });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/** All ASFAI skills, cached for the process lifetime. */
export function listSkills(): Skill[] {
  if (!globalForSkills.asfaiSkills) globalForSkills.asfaiSkills = loadSkills();
  return globalForSkills.asfaiSkills;
}

// Packages an ASFAI skill folder (SKILL.md + assets + VERSION) as a `.skill`
// bundle: a zip rooted at the single skill folder, e.g.
// `personhood-tracker/SKILL.md`, `personhood-tracker/personhood-tracker.html`.
// Served by /api/skills/<name> and offered by the install_asfai_skills tool.

import fs from "node:fs";
import path from "node:path";
import { zipSync } from "fflate";
import { listSkills, SKILLS_DIR } from "@/lib/skills";

/** Resolve a skill folder by name, guarding against path traversal. */
function skillDir(name: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(name)) return null;
  const dir = path.join(SKILLS_DIR, name);
  if (!dir.startsWith(SKILLS_DIR + path.sep)) return null;
  const skill = listSkills().find((s) => s.name === name);
  if (!skill) return null;
  return dir;
}

/** The skill's files as { path, text } with paths rooted at the skill folder
 *  (e.g. "personhood-tracker/SKILL.md"). Used for inline install delivery. */
export function readSkillFiles(name: string): { path: string; text: string }[] | null {
  const dir = skillDir(name);
  const skill = listSkills().find((s) => s.name === name);
  if (!dir || !skill) return null;
  return skill.files.map((rel) => ({
    path: `${name}/${rel}`,
    text: fs.readFileSync(
      /* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ dir, rel),
      "utf8",
    ),
  }));
}

/** Build the `.skill` zip (rooted at the skill folder). Returns null if unknown. */
export function buildSkillBundle(name: string): Uint8Array | null {
  const dir = skillDir(name);
  const skill = listSkills().find((s) => s.name === name);
  if (!dir || !skill) return null;
  const entries: Record<string, Uint8Array> = {};
  for (const rel of skill.files) {
    entries[`${name}/${rel}`] = new Uint8Array(
      fs.readFileSync(
        /* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ dir, rel),
      ),
    );
  }
  return zipSync(entries, { level: 6 });
}

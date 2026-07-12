# Handoff — working state & multi-session workflow

Operational notes for anyone (human or agent) picking up this repo. For the product
overview and stack see [README.md](README.md); for the Next.js-16 gotchas see
[AGENTS.md](AGENTS.md). This file is about **where things are right now** and **how the
parallel sessions coordinate**.

## Current state of `main`

`main` is the deployable trunk (Vercel). It currently includes:

- The **AI Constitution** wiki (articles, theses, resources, voting, moderation, MCP server at `/api/mcp`).
- Three interactive tools, surfaced as cards on the **Resources** page ([src/app/docs/page.tsx](src/app/docs/page.tsx), the `TOOLS` array):
  | Tool | Route | Key files |
  | --- | --- | --- |
  | 🎯 Autonomy Zone | `/autonomous-targeting-game` | [page.tsx](src/app/autonomous-targeting-game/page.tsx) (self-contained client game) |
  | 🧭 AI Personhood Tracker | `/personhood-tracker` | [page.tsx](src/app/personhood-tracker/page.tsx), [PersonhoodTracker.tsx](src/components/PersonhoodTracker.tsx), `src/lib/tracker.ts` |
  | 🕸️ Concept Tracker | `/learn` | `src/app/learn/`, `src/lib/taxonomy.ts`, `src/lib/learning.ts`, `src/content/taxonomy/` |
- The Neon database is **in sync** with the schema (models `ConceptMastery`, `TrackerSubmission`, `TrackerResponse` exist; the old `TrackerQuestion.active` / `TrackerSubmission.x,y` columns were dropped in the personhood redesign).

## Parallel-session model (git worktrees)

Each project runs in its **own git worktree** (separate folder, own branch, own `node_modules` + `.env`) so sessions never collide on files or the staging area. **Never run two agents against one working folder.**

| Worktree folder | Branch | Owner |
| --- | --- | --- |
| `…/ASFAI` | `main` | trunk / integration (reviews & merges) |
| `…/asfai-autonomy-zone` | `autonomy-zone` | Autonomy Zone game |
| `…/asfai-concept-tracker` | `concept-tracker` | Concept Tracker |
| `…/asfai-consciousness-tracker` | `consciousness-tracker` | Personhood/Consciousness Tracker |

Feature branches are cut from `main`. New worktree: `git worktree add ../asfai-<name> -b <branch> main`, then `npm install` and copy `.env` into it.

### Flow for shipping a feature
1. Work on your branch in your worktree; commit and push.
2. Open a PR into `main` (or ask the trunk session to merge).
3. The trunk session merges, resolving the two common conflict points:
   - **`prisma/schema.prisma`** — keep **both** sides (each project adds different models + a relation line on `User`).
   - **`src/app/docs/page.tsx`** — new tools go in the `TOOLS` array as a card; don't add separate bespoke blocks.
4. **If the change touches the schema, sync the DB** (see below) or the feature 500s at runtime.

## ⚠️ Prisma / database gotchas

- **Prisma 7**, no migrations folder. Schema changes reach the DB via **`npx prisma db push`**, run from a `main` checkout. The CLI datasource URL comes from [prisma.config.ts](prisma.config.ts) → `.env` (`DIRECT_URL || DATABASE_URL`).
- **Editing `schema.prisma` does not touch the DB.** The build (`prisma generate && next build`) only regenerates the TS client — it never creates tables. So a schema-adding feature deploys fine but 500s until you `db push`.
- **Push from `main`, not a feature branch** — each branch's schema has only its own models, so pushing a branch would try to drop the other projects' tables.
- One **shared production Neon DB**. `db push` reports data-loss for any dropped/changed column and refuses without `--accept-data-loss`; only pass that flag with the owning session's sign-off.
- Runtime client uses the `@prisma/adapter-pg` driver adapter (see `src/lib/prisma.ts`), not a native engine.

## Per-worktree setup checklist
- `npm install` (each worktree has its own `node_modules`; it's gitignored)
- copy `.env` from another worktree (gitignored; holds the Neon URL)
- `npx prisma generate` if the client looks stale
- `npm run dev` to run locally

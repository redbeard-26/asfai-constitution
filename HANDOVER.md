# Handover — Consciousness (Personhood) Tracker

**Read this first if you're a fresh session rooted in this worktree.**

- **Folder:** `C:\Users\mcare\Code\asfai-consciousness-tracker` (a git worktree)
- **Branch:** `consciousness-tracker` (pushed to `origin`)
- **Repo:** https://github.com/redbeard-26/asfai-constitution
- **Last commit:** `4bd4937` — "Consciousness-tracker: MCP tools, stored coords, question hiding"
- **Open a PR:** https://github.com/redbeard-26/asfai-constitution/pull/new/consciousness-tracker

> ⚠️ Do **not** edit `C:\Users\mcare\Code\ASFAI` (the main project) or the sibling
> `asfai-concept-tracker` worktree. A concurrent session owns those. Work only here.

---

## What this feature is

Turns the read-only Personhood Tracker into an interactive, submittable tool —
usable by a human in the browser **and** by an AI assistant over MCP.

- A **slider (1–100)** for every tracker question.
- A live "your sliders" dot on the plot shows where the current slider values land
  (x = social integration, y = likelihood of consciousness; RMS of each axis).
- Signed-in users **save named submissions**; submissions are **public** and a user
  may keep many to track how their view shifts over time.
- Each public submission plots as a **dot** — **click a dot** (or its list row) to
  load that submission back into the sliders.
- **Filter** the dots by **time**, **name**, and **user**.
- Users can **rename / delete their own** submissions.
- **MCP**: an AI assistant can read the questions and submit an assessment (see below).

Product decisions already made (by the owner): editorial ratings retired (sliders
start at 50); no aggregate/average dot; deleting own submissions is allowed.

## Status

- ✅ Built, typechecked (`tsc` clean), linted (ESLint clean), committed, pushed.
- ✅ **Browser-verified** end-to-end: sliders/live dot/axis math, save, click-to-load,
  time/name/user filters, rename, delete, ownership gate. (Driven via the preview
  tools — see "Gotchas" for the harness quirks.)
- ✅ **MCP-verified** end-to-end with a real MCP client handshake against the dev
  server: `tools/list`, `get_personhood_tracker`, and `submit_personhood_assessment`
  (including the "must rate every question" validation).
- ✅ DB columns + the `test` submission already exist in the shared Neon DB (applied
  via additive `ALTER TABLE`, not `db push` — see the hazard note).

## MCP surface (new)

The project's MCP server lives in `src/app/api/[transport]/route.ts`
(`ai-constitution`, streamable HTTP at `/api/mcp`). Two tracker tools were added
alongside the existing constitution/thesis/resource tools:

| Tool | What it does |
| --- | --- |
| `get_personhood_tracker` | Returns the active questions (key, category, prompt, explanation), the 1–100 scale + axis/horizon semantics, and every public submission (name, by, x, y, answers). |
| `submit_personhood_assessment` | `{ email, name, answers: {questionKey: 1–100} }`. Requires a rating for **every** active question (rejects missing/unknown keys); acts as the email-identified user via `resolveUser`; stores the full responses **plus** computed `x/y`; returns `{ x, y, horizonDistance, zone }`. |

The browser server action and the MCP tool share **`buildTrackerSubmission`** in
`lib/tracker.ts`, so a browser save and an MCP submit write **the same format**.

## Files (all under `src/` unless noted)

| File | Role |
| --- | --- |
| `app/personhood-tracker/page.tsx` | Server component: loads questions + submissions + session user, renders the client component. |
| `components/PersonhoodTracker.tsx` | **Client** component: sliders, SVG plot with per-submission dots + live dot, submit/rename/delete forms, time/name/user filters. |
| `lib/tracker.ts` | Pure, shared helpers: `rms`, `axisScores`, **`buildTrackerSubmission`** (responses + x/y — shared by the action and the MCP tool), `PLOT` geometry, `horizonDistance`. |
| `lib/data.ts` | `getPersonhoodTracker()` returns `{ questions, submissions }`; filters to **active** questions and returns each submission's **stored** x/y. |
| `lib/actions.ts` | Server actions: `createTrackerSubmission` (now computes + stores x/y via the shared helper), `renameTrackerSubmission`, `deleteTrackerSubmission`. |
| `app/api/[transport]/route.ts` | MCP server — added `get_personhood_tracker` + `submit_personhood_assessment`. |
| `content/personhood-tracker.ts` | The 20 seed questions with their original editorial `rating` (the "old default numbers"). |
| `prisma/schema.prisma` | `TrackerQuestion.active`; `TrackerSubmission.x` / `.y`; `TrackerResponse` (keyed by stable `questionKey`). |
| `prisma/seed.ts` | Seeds the questions and a baseline **`test`** submission (from the editorial ratings) owned by a system user. |

## Data model

```
TrackerQuestion   { id, key(unique), category, sortOrder, question, rating,
                    explanation, active(bool), ... }   // active=false hides, never deletes
TrackerSubmission { id, userId → User, name, x, y, createdAt, updatedAt, responses[] }
TrackerResponse   { id, submissionId → TrackerSubmission, questionKey, rating(1-100) }
                    @@unique([submissionId, questionKey])
```

- **Coordinates are stored** (`x`, `y`) at submit time, computed from `responses`
  against the questions active then, and **read as stored** — so a submission keeps
  its plot position even after questions are later hidden or edited.
- `questionKey` is the **stable per-question id** (a string ref to
  `TrackerQuestion.key`, not a FK). Questions are **hidden (`active=false`), never
  deleted**, so keys always resolve and old responses stay associated.
- The baseline **`test`** submission (editorial ratings) plots at **x=30, y=25**,
  owned by system user `baseline@ai-constitution.local` (display name "AI Constitution").

## ⚠️ Shared-database hazard (important)

This worktree shares the **same Neon Postgres DB** as the other worktrees via the
same `.env`. `prisma db push` / `prisma migrate` makes the DB match **this** schema
and will **DROP** tables another worktree added (e.g. `ConceptMastery`).

- From here, run **only** `npx prisma generate` (client types, no DB change).
- Schema changes to the shared DB were applied with **additive raw SQL**
  (`ALTER TABLE … ADD COLUMN IF NOT EXISTS`) — never `db push`. Do the same for any
  future column: additive SQL only.
- Columns already live in the DB: `TrackerQuestion.active`, `TrackerSubmission.x`,
  `TrackerSubmission.y`. The `test` submission row already exists too.
- To check whether a column/table exists, use read-only `npx prisma db pull --print`.
- A **fresh** database is provisioned by `prisma db push` + `npm run db:seed` (which
  also creates the `test` submission) — only ever against a throwaway DB.

## Commands

```bash
npx prisma generate     # client types (safe; no DB change)
npx tsc --noEmit        # typecheck
npx eslint src/...      # lint (project uses ESLint flat config; no `next lint`)
npm run dev             # Next 16 dev server (Turbopack). Pick a free port if the
                        # other session already holds 3000.
```

## Environment gotchas

- **Restart the dev server after `prisma generate`.** Turbopack keeps the old Prisma
  client in memory; a schema field added to the client won't be recognized at runtime
  (`Unknown argument 'active'`) until the server is restarted — even though `tsc` passes.
- **Preview harness quirks** (not app bugs): synthetic clicks don't fire React
  `onClick`/form submission on this page — drive interactions with a native
  `element.click()` or `form.requestSubmit()` via eval. `preview_screenshot` times out
  on this heavy 20-slider page; verify with snapshot/eval/network/logs instead.
- **Never create scratch `.ts` files in the project root** while the dev server runs —
  Turbopack Fast Refresh fires and resets the form's React state mid-test. Keep DB
  scripts in the scratchpad dir (run with `npx tsx --env-file=.env …`).
- The Bash tool's cwd may reset between calls — use absolute paths or `cd` per command.
- Git prints harmless `LF will be replaced by CRLF` warnings on Windows.
- **This is a modified Next.js (v16.2.7).** Per `AGENTS.md`, read the relevant guide in
  `node_modules/next/dist/docs/` before writing framework code. `next lint` is removed
  (use ESLint directly); standard React 19 server actions via `<form action={...}>`;
  `revalidatePath` is fine.
- Auth is email magic-link (NextAuth), but `AUTH_RESEND_KEY` **is set**, so magic links
  go out as **real emails** (not printed to the console). Session strategy is `database`;
  to test signed-in flows headlessly, seed a `User` + `Session` row and set the
  `authjs.session-token` cookie, then clean up.

## Suggested next steps

1. **Open the PR** (link above); decide whether to keep or delete this `HANDOVER.md`
   before merge.
2. Optional MCP parity: `rename` / `delete` / `list` tracker tools (only get + submit
   exist today). Consider rate-limiting the MCP submit (the browser action already is;
   the MCP tools currently aren't, matching the other MCP write tools).
3. Optional polish: reset the submit-name field after a successful save; empty-state
   copy; a "connect the dots by date" trend line per user.

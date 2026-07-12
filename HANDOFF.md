# Handoff — `autonomy-zone` branch

_Last updated: 2026-07-09_

## What this branch is

The **Autonomy Zone** — a battlefield-commander prototype game — plus a **global
high-score leaderboard**. The game lives entirely in one client component; the
leaderboard is backed by Postgres (shared Neon DB) through two anonymous server
actions.

- Game page: [`src/app/autonomous-targeting-game/page.tsx`](src/app/autonomous-targeting-game/page.tsx)
- Server actions: [`src/lib/actions.ts`](src/lib/actions.ts) — `getHighScores`, `submitHighScore` (search "Autonomy Zone game" near the end)
- Model: `HighScore` in [`prisma/schema.prisma`](prisma/schema.prisma)

## Recent commits (branch tip = `026f3da`, pushed to `origin/autonomy-zone`)

| Commit | Summary |
| --- | --- |
| `026f3da` | Make the high-score leaderboard **global** (DB-backed) — replaced the localStorage version |
| `ae2063f` | First cut: optional post-game submit + **local** (localStorage) leaderboard |

## High-score feature — how it works

- When a game ends (won/lost), an **optional** prompt offers to add your score to
  the global board. Submitting is **anonymous** — no sign-in; the name is free text.
- `submitHighScore(...)` validates with Zod, applies a coarse global rate limit
  (≤60 inserts/min), inserts a row, and returns the new row id + refreshed top 20.
- `getHighScores()` returns the global **top 20**, ranked by `score` desc, then
  fewer `ticks`, then earlier `createdAt`.
- The board is read on mount ("Loading…" → rows); the just-submitted row is
  highlighted (via `myScoreId`) until the next reload.
- The player's **name** is still remembered in `localStorage` (`autonomy-zone-player`)
  for convenience — the **scores** are all in Postgres.

### `HighScore` table

Columns: `id` (cuid), `name`, `score` (Int), `outcome` (`WON`|`LOST`), `ticks`,
`civilians`, `createdAt`; index on `score`. Already created in the shared Neon DB
and present in the schema, so a `main`/Vercel deploy needs no migration step.

## ⚠️ Shared Neon DB — do NOT `prisma db push`

Multiple git worktrees (main, concept-tracker, consciousness-tracker, autonomy-zone)
share **one** Neon Postgres DB via the same `.env`. `prisma db push`/`migrate` makes
the DB match the current branch's schema and will **drop** tables other branches
added. From this branch, only ever run `npx prisma generate`.

The `HighScore` table was created **additively** with a one-off script
(`CREATE TABLE IF NOT EXISTS "HighScore" (…)` + `CREATE INDEX IF NOT EXISTS`,
names matching Prisma's conventions), never via `db push`. Repeat that pattern if
you add another table from a feature branch.

**Gotcha:** after `prisma generate`, a running `next dev` still holds the old
Prisma client, so `prisma.highScore` is `undefined` (`Cannot read properties of
undefined (reading 'count')`). **Restart the dev server** after generating.

## Run & verify

```bash
npm run dev            # Next 16 dev server (port 3000)
# open http://localhost:3000/autonomous-targeting-game
```

Quick smoke test: click **Lvl 1**, **Play**, let it finish (~5 ticks @ 3s), type a
name, **Submit** → row appears highlighted; **reload** → row persists from the DB
(proves it's global, not local). `npx tsc --noEmit` and `npx eslint` both pass for
the touched files (a few pre-existing `react-hooks` warnings/errors remain in
`page.tsx`, unrelated to this work).

## Possible next steps (not started)

- Record and show the **level/board size** with each score (currently score, result,
  ticks, civilians, date only).
- Optional "clear board" is intentionally **not** exposed (global board) — would
  need a moderator/admin gate if ever wanted.
- Consider tying a submission to the signed-in user when one exists (still allowing
  anonymous), for future moderation.

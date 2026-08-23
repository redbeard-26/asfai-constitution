# AI Constitution

An open, community-developed draft constitution for AI, **hosted by the American
Society for AI** (ASFAI). It is a collaborative effort — not ASFAI's official
position. Anyone can read, comment, and propose edits in the browser;
**moderators approve every change before it is published**. Content is organized
into two categories — **presentation** (the constitution articles) and
**discussion** (deliberation pages).

Styling follows the ASFAI Brand & Document Style Guide (serif type, gold rules,
small-caps headings; green = agreement, terracotta = tension).

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions) — standalone containers on AWS
- **Prisma 7** + **PostgreSQL** (Neon), via the `@prisma/adapter-pg` driver adapter
- **Auth.js (NextAuth v5)** — Google OAuth + email magic links
- **Tailwind CSS v4** + `@tailwindcss/typography`
- **MCP server** (`mcp-handler` + `@modelcontextprotocol/sdk`) at `/api/mcp` — AI-native access

## MCP server (AI-native access)

The project ships a **Model Context Protocol** server mounted in the same app at
**`/api/mcp`** (Streamable HTTP), so AI clients can read the constitution, search
resources, and contribute through the **moderated** proposal queue. Source:
[`src/app/api/[transport]/route.ts`](src/app/api/[transport]/route.ts).

**Read tools** (open, no identity needed)

| Tool | Purpose |
| --- | --- |
| `get_constitution` | Preamble + the full article/thesis tree |
| `get_article(slug)` | An article's text + its theses |
| `get_thesis(slug)` | A thesis's text, vote score + linked resources (stance + relevance) |
| `list_candidates` | Candidate theses, ordered by net vote score |
| `search_resources(query)` | Full-text search of the resource library |
| `get_resource(slug)` | A resource + the pages it informs (stance + relevance) |
| `list_resources_for_page(slug)` | Resources linked to a page (stance + relevance) |
| `list_comments(slug)` | Visible discussion comments on a page |

**User-action tools** (require an `email` to attribute the action)

| Tool | Purpose |
| --- | --- |
| `vote(slug, direction, email)` | Up/down vote a thesis or candidate (re-vote to remove) |
| `post_comment(slug, body, email, parentId?)` | Add a discussion comment |
| `propose_edit(slug, proposedContent, summary?, email)` | Submit an edit → enters moderation; **never auto-published** |
| `create_candidate(title, text, email)` | Submit a candidate thesis for voting |

Reads are open. User actions are attributed to the supplied email (find-or-create
by email). Edits still require human moderator approval, and **moderator actions
(approve/reject, promote/demote, roles) are done on the website**, not over MCP.
End-user connection instructions live at **`/connect`** (the "AI Connector" tab).

**Connect** (clients supporting Streamable HTTP, e.g. Claude):

```json
{ "mcpServers": { "ai-constitution": { "url": "https://asfai.fenix.ai/api/mcp" } } }
```

Local dev endpoint: `http://localhost:3000/api/mcp`.

## How it works

- **Pages** have a current published **Revision** and a full revision history.
- A signed-in user opens **Propose edit**, edits the markdown, and submits an
  **EditProposal** (status `PENDING`). Nothing public changes.
- A **moderator** reviews the proposal in **/moderation** (side-by-side line
  diff), then **approves** (creates a new revision and publishes it) or
  **rejects** (with an optional note). Edits written against an outdated
  revision are flagged as stale.
- **Comments** are threaded and first-class on every page. Authors can delete
  their own; moderators can hide/unhide.
- **Resources** are a moderator-curated library (`/docs`) of materials that inform
  the discussion: hosted documents (panel reports, memos — stored as markdown) and
  **external resources** (links to outside work, with a *source* organization and
  an external URL; body optional). Each resource links to many theses/articles;
  linked pages show a "Related resources" panel and each resource lists the theses
  it informs. Each link carries a hidden **relevance score (0–1)** so the most
  relevant resources surface first. Seeded with the AI Values panel report,
  Collective Intelligence Project works, and a library of external references
  drawn from the project's resource list (UDHR, US/Canadian constitutions,
  EU AI Act, OECD/UNESCO/NIST frameworks, Council of Europe Convention, SEP
  philosophy entries, MIT AI Risk Repository, AI-2027, the NPT, AGORA, and more).
- **Voting & candidate theses** — signed-in users up/down-vote theses and
  **candidate theses** (`/candidates`), a community proposal list ordered by net
  score. A candidate is a `Page` of type `CANDIDATE` (so it has its own text,
  discussion, history, and resources). Moderators **promote** a candidate into an
  article (it becomes a regular thesis), or **demote** a thesis back into the
  candidate pool (the inverse of promote — never deletes; votes/discussion/history
  are kept).
- **Roles:** `VIEWER` (default) → `MODERATOR` (review edits, moderate comments,
  revert, manage documents, promote/demote candidates) → `ADMIN` (manage roles).
  Emails in `ADMIN_EMAILS` are auto-promoted to admin on sign-in.
- **Archiving users:** every personal action (vote, comment, proposal) is tied to
  a user (required author + cascade). An admin can **archive** a user from
  `/admin/users`, which excludes their votes from scores, hides their comments,
  and drops their pending proposals from the queue (reversible via Unarchive).
  Published revisions and curated resources are communal and kept.

## Local development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill in:

   - `DATABASE_URL` — pooled Postgres connection (host usually contains `-pooler`)
   - `DIRECT_URL` — non-pooled connection (used for migrations / `db push`)
   - `AUTH_SECRET` — `npx auth secret` (or any random 32-byte base64 string)
   - `AUTH_URL` — `http://localhost:3000` in dev
   - `ADMIN_EMAILS` — comma-separated emails to grant admin (use the email you'll sign in with)
   - *(optional)* `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` for Google sign-in
   - *(optional)* `AUTH_RESEND_KEY` + `EMAIL_FROM` to actually email magic links

   > Without `AUTH_RESEND_KEY`, magic-link sign-in still works in dev — the link
   > is **printed to the server console**. Paste it into your browser to sign in.

3. **Create the schema and seed the initial theses**

   ```bash
   npm run db:push     # creates tables in your database
   npm run db:seed     # imports the four articles + discussion pages + admin user
   ```

4. **Run it**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (`prisma generate && next build`) |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:seed` | Seed initial content + admin users |
| `npm run db:studio` | Open Prisma Studio to inspect data |

## Deploying to AWS

Production uses a manually released AWS stack shared with `redbeard-26/asfai-education`. GitHub pushes do not deploy it. See [ASFAI AWS deployment](docs/AWS-HOSTING.md) for the CloudFormation, CodeBuild, ECR, EC2, Caddy, Secrets Manager, DNS, rollback, and Vercel-freeze procedure.

Set these runtime environment variables in the `asfai/constitution` Secrets Manager record:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | pooled connection string |
| `DIRECT_URL` | non-pooled connection string |
| `AUTH_SECRET` | random 32-byte base64 secret |
| `ADMIN_EMAILS` | comma-separated admin emails |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | *(optional)* Google OAuth |
| `AUTH_RESEND_KEY` / `EMAIL_FROM` | *(optional)* email magic links |

The Vercel-to-AWS importer retains compatible Neon names such as `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`. The container configuration sets `AUTH_URL`, `AUTH_TRUST_HOST`, and the private education origin explicitly.

Initialize the database once from your machine, with the production connection strings in `.env`:

```bash
npm run db:push
npm run db:seed
```

The on-demand CodeBuild release runs `prisma generate && next build`, publishes both application images, and updates the SSM-managed host. `constitution.asfai.org` and `education.asfai.org` are A records for the stack's Elastic IP. Keep `https://constitution.asfai.org/api/auth/callback/google` registered with Google OAuth.

## Authentication setup

Sign-in is handled by Auth.js. Two methods are supported; both are optional in
dev (email links print to the console when Resend isn't configured).

### Google OAuth

1. In the [Google Cloud Console](https://console.cloud.google.com), create an
   OAuth 2.0 Client ID (type: Web application).
2. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://<your-domain>/api/auth/callback/google` (production)
3. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`. The "Continue with Google"
   button appears automatically once both are present.

### Resend (emailed magic links)

1. Create an API key at [resend.com](https://resend.com) and verify a sending
   domain.
2. Set `AUTH_RESEND_KEY` and `EMAIL_FROM` (e.g. `AI Constitution <noreply@yourdomain>`).
   When `AUTH_RESEND_KEY` is set, links are emailed; otherwise they print to the
   server console (handy for local dev).

## Rate limiting

Edit proposals and comments are rate-limited per user via database row counts
(`src/lib/rate-limit.ts`): by default **5 proposals / 10 min** and **10 comments
/ 5 min**. Moderators and admins are exempt. Tune the windows in
`src/lib/actions.ts`.

## Notes

- Enum-like fields (`role`, `category`, `status`) are stored as strings and
  validated in `src/lib/constants.ts`.
- Real-time collaborative editing is intentionally out of scope — the
  proposal/approval model is plain request/response, which is why it runs on
  Vercel's serverless platform.
- Anti-spam (rate limiting / captcha) is not yet implemented; consider adding it
  before opening contributions fully to the public.

---
name: personhood-tracker
description: Show the ASFAI AI Personhood Tracker as an interactive artifact — a self-contained page (embedded data snapshot + live hydration from asfai.org) where the user rates AI on two axes and sees where it lands on the "personhood horizon". Use when someone wants to explore, visualize, or fill out an AI personhood / consciousness assessment.
---

# ASFAI Personhood Tracker — render it as an artifact

This skill bundles a self-contained HTML page, `personhood-tracker.html`, that
renders the ASFAI AI Personhood Tracker. Your job is to put it in front of the
user as an artifact — **cheaply, without reading the HTML into context.**

## Render it (3 cheap tool calls; the HTML never enters the model context)

The page is an asset file sitting next to this SKILL.md. Do **not** `cat` it,
read it, or paste it into the conversation — it is ~30 KB and would burn context
for nothing. Instead move the bytes around as a file:

1. **Copy the asset out** of the skill folder to wherever your host renders files
   from, e.g.:
   `cp ~/.claude/skills/personhood-tracker/personhood-tracker.html ./personhood-tracker.html`
2. **Render it:** send the file to the user for inline display (e.g. `SendUserFile`
   with `display: "render"`), or `update_artifact` an existing tracker artifact in
   place to refresh it.
3. That's it — it opens in the side panel, fully interactive.

The page stands on its own: drag the sliders to rate each question, use the
presets (Set to 0 / Set to 100 / Randomize / load a submission), and watch your
dot move on the personhood horizon.

## It stays fresh on its own — don't regenerate it

The page ships with a data snapshot embedded, and on open it makes one attempt to
hydrate live data from `https://constitution.asfai.org/api/personhood-tracker.json`
(falling back to the snapshot if a sandbox blocks the fetch). So a bundled copy
does **not** go stale — there's no need to rebuild it before rendering. To pull a
newer bundle anyway, call `install_asfai_skills` with `{ skill: "personhood-tracker" }`.

## What it shows

Two axes decide the question:

- **Horizontal** — the social & economic need to grant AI rights (RMS of the
  Social questions).
- **Vertical** — the likelihood AI is a sentient moral patient (RMS of the
  Consciousness questions).

Distance from the origin is the score: under 50 personhood is not justified,
50–100 it may be appropriate, and past the quarter-circle **personhood horizon**
at 100 it makes sense.

## Saving an assessment (optional)

Ratings made in the page are **local to the artifact** — they don't post
anywhere. To record a public assessment on the live site, use the ASFAI
Constitution MCP connector:

1. `get_personhood_tracker` for the question keys,
2. rate every question 0–100,
3. `submit_personhood_assessment` with the user's email.

Or point the user at <https://constitution.asfai.org/personhood-tracker> to
submit in the browser.

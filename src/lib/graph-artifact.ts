// Self-contained HTML renderer for a learner's knowledge-graph neighborhood.
// Pure function: takes a Neighborhood (from taxonomy.ts) plus optional progress
// and returns a single HTML document with inline SVG + inline CSS/JS and NO
// external resources (no CDNs, no web fonts, no network requests) so it renders
// under a strict artifact Content-Security-Policy.
//
// Layout is intentionally simple and deterministic — nodes are bucketed into
// columns by domain and stacked by age within each column — so we avoid a heavy
// force simulation and keep the picture legible (the neighborhood is already
// capped to ~40 locked nodes upstream). Node color encodes mastery status;
// edge style encodes hard vs soft prerequisites.

import { getConcept, type Neighborhood, type NodeStatus } from "@/lib/taxonomy";

export interface GraphProgress {
  masteredCount: number;
  learningCount: number;
  totalTopics: number;
}

// --- geometry -------------------------------------------------------------
const NODE_W = 190;
const NODE_H = 44;
const COL_GAP = 240; // horizontal distance between domain columns (center-to-center)
const ROW_GAP = 64; // vertical distance between stacked nodes
const MARGIN_X = 40;
const HEADER_H = 96; // reserved band at top for title + legend
const MARGIN_BOTTOM = 40;

interface Placed {
  id: string;
  name: string;
  domain: string;
  status: NodeStatus;
  cx: number;
  cy: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Truncate a label to fit the node box, adding an ellipsis when clipped. */
function clip(name: string, max = 26): string {
  return name.length > max ? name.slice(0, max - 1).trimEnd() + "…" : name;
}

/**
 * Render the neighborhood as a standalone interactive HTML document.
 * `progress` is optional; when supplied it drives the summary header line.
 */
export function renderKnowledgeGraph(
  hood: Neighborhood,
  progress?: GraphProgress,
): string {
  // Bucket nodes into columns by domain, preserving a stable column order
  // (by first appearance sorted alphabetically) and stacking within a column
  // by age then name so the flow reads youngest-at-top.
  const byDomain = new Map<string, Placed[]>();
  for (const n of hood.nodes) {
    const arr = byDomain.get(n.domain) ?? [];
    arr.push({ id: n.id, name: n.name, domain: n.domain, status: n.status, cx: 0, cy: 0 });
    byDomain.set(n.domain, arr);
  }

  const ageOf = new Map<string, number>();
  for (const n of hood.nodes) ageOf.set(n.id, n.ageRangeStart);

  const domains = [...byDomain.keys()].sort((a, b) => a.localeCompare(b));
  const pos = new Map<string, Placed>();
  let maxRows = 0;

  domains.forEach((domain, col) => {
    const nodes = byDomain.get(domain)!;
    nodes.sort(
      (a, b) => (ageOf.get(a.id)! - ageOf.get(b.id)!) || a.name.localeCompare(b.name),
    );
    const cx = MARGIN_X + NODE_W / 2 + col * COL_GAP;
    nodes.forEach((p, row) => {
      p.cx = cx;
      p.cy = HEADER_H + NODE_H / 2 + row * ROW_GAP;
      pos.set(p.id, p);
    });
    maxRows = Math.max(maxRows, nodes.length);
  });

  const width = Math.max(
    MARGIN_X * 2 + NODE_W + (domains.length - 1) * COL_GAP,
    640,
  );
  const height = HEADER_H + Math.max(maxRows, 1) * ROW_GAP + MARGIN_BOTTOM;

  // --- edges (drawn first, behind nodes) ---
  const edgeSvg: string[] = [];
  for (const e of hood.edges) {
    const from = pos.get(e.from);
    const to = pos.get(e.to);
    if (!from || !to) continue;
    // Curve from the prerequisite's bottom edge to the dependent's top edge.
    const x1 = from.cx;
    const y1 = from.cy + NODE_H / 2;
    const x2 = to.cx;
    const y2 = to.cy - NODE_H / 2;
    const my = (y1 + y2) / 2;
    const d = `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
    const cls = e.strength === "hard" ? "edge edge-hard" : "edge edge-soft";
    edgeSvg.push(`<path class="${cls}" d="${d}" marker-end="url(#arrow)"/>`);
  }

  // --- nodes ---
  const nodeSvg: string[] = [];
  for (const p of pos.values()) {
    const t = getConcept(p.id);
    const desc = t?.description ?? "";
    const x = p.cx - NODE_W / 2;
    const y = p.cy - NODE_H / 2;
    nodeSvg.push(
      `<g class="node node-${p.status}" data-name="${escapeHtml(p.name)}" ` +
        `data-desc="${escapeHtml(desc)}" data-status="${p.status}" data-domain="${escapeHtml(p.domain)}">` +
        `<rect x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="9"/>` +
        `<text x="${p.cx}" y="${p.cy + 4}" text-anchor="middle">${escapeHtml(clip(p.name))}</text>` +
        `</g>`,
    );
  }

  const subjectLabel = hood.subject ?? "All subjects";
  const c = hood.counts;
  const progressLine = progress
    ? `${progress.masteredCount} mastered · ${progress.learningCount} learning · of ${progress.totalTopics} topics`
    : `${c.mastered} mastered · ${c.frontier} on frontier · ${c.locked} locked`;

  // Everything is inlined; no external references.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Knowledge Graph — ${escapeHtml(subjectLabel)}</title>
<style>
  :root {
    --bg: #0f1420; --panel: #161d2e; --ink: #e7ecf5; --muted: #97a2b8;
    --mastered: #3ddc84; --mastered-ink: #06210f;
    --frontier: #ffc24b; --frontier-ink: #2a1c00;
    --locked: #3a465e; --locked-ink: #aab6cc;
    --edge-hard: #6d7a95; --edge-soft: #465066;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--bg); color: var(--ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  header { padding: 16px 20px 8px; }
  h1 { margin: 0 0 4px; font-size: 18px; font-weight: 650; }
  .sub { color: var(--muted); font-size: 13px; }
  .legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 10px; font-size: 12px; color: var(--muted); align-items: center; }
  .legend .chip { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { width: 13px; height: 13px; border-radius: 4px; display: inline-block; }
  .sw-mastered { background: var(--mastered); }
  .sw-frontier { background: var(--frontier); box-shadow: 0 0 6px var(--frontier); }
  .sw-locked { background: var(--locked); }
  .line { width: 22px; height: 0; display: inline-block; border-top: 2px solid var(--edge-hard); }
  .line-soft { border-top: 2px dashed var(--edge-soft); }
  .canvas { overflow: auto; padding: 0 12px 24px; }
  svg { display: block; }
  .edge { fill: none; }
  .edge-hard { stroke: var(--edge-hard); stroke-width: 1.8; }
  .edge-soft { stroke: var(--edge-soft); stroke-width: 1.6; stroke-dasharray: 5 4; }
  .node { cursor: default; }
  .node text { font-size: 12px; fill: var(--ink); pointer-events: none; }
  .node rect { stroke-width: 1.5; }
  .node-mastered rect { fill: var(--mastered); stroke: #2bbf6c; }
  .node-mastered text { fill: var(--mastered-ink); font-weight: 600; }
  .node-frontier rect { fill: var(--frontier); stroke: #e0a020; filter: drop-shadow(0 0 5px rgba(255,194,75,.75)); }
  .node-frontier text { fill: var(--frontier-ink); font-weight: 600; }
  .node-locked rect { fill: var(--locked); stroke: #4a5872; }
  .node-locked text { fill: var(--locked-ink); }
  .node:hover rect { stroke-width: 2.5; }
  #tip { position: fixed; z-index: 10; max-width: 320px; padding: 10px 12px; border-radius: 8px;
    background: var(--panel); border: 1px solid #2a3550; color: var(--ink); font-size: 12.5px;
    line-height: 1.4; pointer-events: none; opacity: 0; transition: opacity .08s; box-shadow: 0 8px 24px rgba(0,0,0,.5); }
  #tip .t-name { font-weight: 650; margin-bottom: 3px; display: block; }
  #tip .t-meta { color: var(--muted); font-size: 11px; margin-bottom: 5px; }
  .empty { padding: 40px 20px; color: var(--muted); font-size: 14px; }
</style>
</head>
<body>
<header>
  <h1>Knowledge Graph — ${escapeHtml(subjectLabel)}</h1>
  <div class="sub">${escapeHtml(progressLine)}</div>
  <div class="legend">
    <span class="chip"><span class="swatch sw-mastered"></span>Mastered</span>
    <span class="chip"><span class="swatch sw-frontier"></span>Ready to learn (frontier)</span>
    <span class="chip"><span class="swatch sw-locked"></span>Locked</span>
    <span class="chip"><span class="line"></span>hard prerequisite</span>
    <span class="chip"><span class="line line-soft"></span>soft prerequisite</span>
  </div>
</header>
<div class="canvas">
${
    hood.nodes.length === 0
      ? `<div class="empty">Nothing to show yet — no mastered concepts or frontier in this scope.</div>`
      : `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Knowledge graph">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--edge-hard)"/>
    </marker>
  </defs>
  <g class="edges">${edgeSvg.join("")}</g>
  <g class="nodes">${nodeSvg.join("")}</g>
</svg>`
  }
</div>
<div id="tip" role="tooltip"></div>
<script>
(function () {
  var tip = document.getElementById("tip");
  var canvas = document.querySelector(".canvas");
  if (!canvas) return;
  function show(e, g) {
    var name = g.getAttribute("data-name") || "";
    var desc = g.getAttribute("data-desc") || "";
    var status = g.getAttribute("data-status") || "";
    var domain = g.getAttribute("data-domain") || "";
    tip.innerHTML = "";
    var n = document.createElement("span"); n.className = "t-name"; n.textContent = name; tip.appendChild(n);
    var m = document.createElement("span"); m.className = "t-meta"; m.textContent = status + " \\u00b7 " + domain; tip.appendChild(m);
    if (desc) { var d = document.createElement("div"); d.textContent = desc; tip.appendChild(d); }
    tip.style.opacity = "1";
    move(e);
  }
  function move(e) {
    var pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
    var x = e.clientX + pad, y = e.clientY + pad;
    if (x + w > window.innerWidth) x = e.clientX - w - pad;
    if (y + h > window.innerHeight) y = e.clientY - h - pad;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function hide() { tip.style.opacity = "0"; }
  canvas.addEventListener("mouseover", function (e) {
    var g = e.target.closest ? e.target.closest(".node") : null;
    if (g) show(e, g);
  });
  canvas.addEventListener("mousemove", function (e) {
    if (tip.style.opacity === "1") move(e);
  });
  canvas.addEventListener("mouseout", function (e) {
    var g = e.target.closest ? e.target.closest(".node") : null;
    if (g) hide();
  });
})();
</script>
</body>
</html>`;
}

// In-app knowledge-graph map: a compact, app-styled inline SVG of a learner's
// neighborhood (mastered ∪ frontier ∪ one hop of locked topics), scoped to a
// subject so it stays legible. This is the on-page cousin of the standalone
// artifact produced by src/lib/graph-artifact.ts (used by the MCP tool) — same
// data, but rendered with the site's brand tokens and native <title> tooltips
// instead of a self-contained document. Pure/server component.

import Link from "next/link";
import { getConcept, type Neighborhood, type NodeStatus } from "@/lib/taxonomy";

const NODE_W = 172;
const NODE_H = 40;
const COL_GAP = 208;
const ROW_GAP = 54;
const PAD = 24;

const FILL: Record<NodeStatus, string> = {
  mastered: "var(--pro-rule)",
  frontier: "var(--gold)",
  locked: "var(--panel)",
};
const STROKE: Record<NodeStatus, string> = {
  mastered: "var(--pro-head)",
  frontier: "var(--gold-deep)",
  locked: "var(--panel-border)",
};
const TEXT: Record<NodeStatus, string> = {
  mastered: "#ffffff",
  frontier: "var(--ink)",
  locked: "var(--muted)",
};

function clip(name: string, max = 24): string {
  return name.length > max ? name.slice(0, max - 1).trimEnd() + "…" : name;
}

interface Placed {
  id: string;
  name: string;
  status: NodeStatus;
  cx: number;
  cy: number;
}

/**
 * Render the neighborhood. `hrefFor` turns a node id into a link (so clicking a
 * node opens its concept detail); omit it for a static map. The SVG is meant to
 * live inside an `overflow-x-auto` container — width grows with the domain count.
 */
export function KnowledgeGraph({
  hood,
  hrefFor,
}: {
  hood: Neighborhood;
  hrefFor?: (id: string) => string;
}) {
  if (hood.nodes.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted">
        Nothing to map here yet — master a concept or pick a subject with a frontier.
      </p>
    );
  }

  // Bucket by domain into columns; stack within a column by age then name.
  const age = new Map(hood.nodes.map((n) => [n.id, n.ageRangeStart]));
  const byDomain = new Map<string, typeof hood.nodes>();
  for (const n of hood.nodes) {
    const arr = byDomain.get(n.domain) ?? [];
    arr.push(n);
    byDomain.set(n.domain, arr);
  }
  const domains = [...byDomain.keys()].sort((a, b) => a.localeCompare(b));

  const pos = new Map<string, Placed>();
  let maxRows = 0;
  domains.forEach((domain, col) => {
    const nodes = [...byDomain.get(domain)!].sort(
      (a, b) => (age.get(a.id)! - age.get(b.id)!) || a.name.localeCompare(b.name),
    );
    const cx = PAD + NODE_W / 2 + col * COL_GAP;
    nodes.forEach((n, row) => {
      pos.set(n.id, {
        id: n.id,
        name: n.name,
        status: n.status,
        cx,
        cy: PAD + NODE_H / 2 + row * ROW_GAP,
      });
    });
    maxRows = Math.max(maxRows, nodes.length);
  });

  const width = PAD * 2 + NODE_W + (domains.length - 1) * COL_GAP;
  const height = PAD * 2 + Math.max(maxRows, 1) * ROW_GAP;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`Knowledge-graph map: ${hood.counts.mastered} mastered, ${hood.counts.frontier} ready to learn, ${hood.counts.locked} locked.`}
      style={{ fontFamily: "var(--font-serif)" }}
    >
      <defs>
        <marker
          id="kg-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" />
        </marker>
      </defs>

      {hood.edges.map((e, i) => {
        const from = pos.get(e.from);
        const to = pos.get(e.to);
        if (!from || !to) return null;
        const x1 = from.cx;
        const y1 = from.cy + NODE_H / 2;
        const x2 = to.cx;
        const y2 = to.cy - NODE_H / 2;
        const my = (y1 + y2) / 2;
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`}
            fill="none"
            stroke={e.strength === "hard" ? "var(--muted)" : "var(--rule)"}
            strokeWidth={e.strength === "hard" ? 1.4 : 1.2}
            strokeDasharray={e.strength === "hard" ? undefined : "5 4"}
            markerEnd="url(#kg-arrow)"
          />
        );
      })}

      {[...pos.values()].map((p) => {
        const desc = getConcept(p.id)?.description ?? "";
        const node = (
          <g>
            <rect
              x={p.cx - NODE_W / 2}
              y={p.cy - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={7}
              fill={FILL[p.status]}
              stroke={STROKE[p.status]}
              strokeWidth={1.4}
            />
            <text
              x={p.cx}
              y={p.cy + 4}
              textAnchor="middle"
              fontSize={12}
              fontWeight={p.status === "locked" ? 400 : 600}
              fill={TEXT[p.status]}
            >
              {clip(p.name)}
            </text>
            <title>{`${p.name} — ${p.status}${desc ? `\n${desc}` : ""}`}</title>
          </g>
        );
        return hrefFor ? (
          <Link key={p.id} href={hrefFor(p.id)}>
            {node}
          </Link>
        ) : (
          <g key={p.id}>{node}</g>
        );
      })}
    </svg>
  );
}

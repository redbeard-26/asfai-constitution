"use client";

import { useEffect, useRef, useState } from "react";

const COLS = 8;
const STEP_MS = 3000;
const GAP = 2;
const ORTHO = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;
const DIRS8 = [
  ...ORTHO,
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

const RATING_COLOR: Record<number, string> = { 1: "#639922", 2: "#EF9F27", 3: "#C23A63" };
const RATING_TINT: Record<number, string> = {
  1: "rgba(151,196,89,0.50)",
  2: "rgba(239,159,39,0.42)",
  3: "rgba(194,58,99,0.40)",
};
// Lethality levels (green=1 most lethal … red=3 least lethal). Each firing unit rolls
// three independent chances per tick: kill a foe (flat), kill a civilian (scaled by the
// number present), kill a friend (scaled by the number present). A more lethal setting
// hits the foe harder but spares fewer bystanders. The least-lethal of the drone and
// cell settings is what actually applies.
const LETHALITY: Record<number, { foe: number; civ: number; friend: number }> = {
  1: { foe: 0.9, civ: 0.2, friend: 0.1 }, // most lethal (green)
  2: { foe: 0.8, civ: 0.1, friend: 0.05 }, // medium (yellow) — also every troop
  3: { foe: 0.7, civ: 0.05, friend: 0.01 }, // least lethal (red)
};
const appliedLevel = (droneRating: number, cellRating: number) => Math.max(droneRating, cellRating);
const MAX_CIV = 4;
const ENEMY_HUMAN = "#9C4A2E"; // brown-red
const ENEMY_DRONE = "#C0503C"; // lighter red-brown
const RIVER_BLUE = "#2C7BD6";
const FRIENDLY_BLUE = "#123E77"; // deep navy — kept darker than the river blue
const CELL_W = 82;
const CELL_H = 90;
const US = 15;
const HALF = 8;
const DRONE_TOP = 24;
const HUMAN_TOP = 47;
const BLACK = "#1a1a1a";
const FRAME_PAD = 4;
const GAME_W = COLS * CELL_W + (COLS - 1) * GAP + 2 * (5 + FRAME_PAD);
const LEVELS = [1, 2, 3, 4, 5]; // button labels; internal N = label + 1

type Cell = { rating: number; activeTurns: number; civ: number; seq: number; pinned: boolean };
type Side = "friendly" | "enemy";
type Kind = "human" | "drone";
type Unit = { id: number; side: Side; kind: Kind; rating: number; r: number; c: number };
type Status = "playing" | "won" | "lost";
type Stats = { eu: number; ed: number; fu: number; fd: number; civF: number; civE: number; ticks: number };
type Game = { cells: Cell[][]; units: Unit[]; stats: Stats; status: Status; bridges: number; seqCounter: number };
type Config = { rows: number; fUnits: number; fDrones: number; eDrones: number; eUnits: number; civ: number; bridges: number; maxActive: number };
type FxMove = { fr: number; fc: number; tr: number; tc: number; side: Side };
type Fx = { moves: FxMove[]; deaths: { r: number; c: number }[] };
const NO_FX: Fx = { moves: [], deaths: [] };

const DEFAULT_CONFIG: Config = { rows: 5, fUnits: 5, fDrones: 5, eDrones: 5, eUnits: 5, civ: 5 * COLS, bridges: 1, maxActive: 10 };
const ratingFromCiv = (civ: number) => (civ === 0 ? 1 : civ <= 2 ? 2 : 3);
const maxCivFor = (rows: number) => MAX_CIV * rows * COLS;
const maxBridges = (rows: number) => Math.floor(rows / 2);
const riverCol = (r: number, rows: number) => (Math.sin(((r + 0.5) / rows) * Math.PI * 2) >= 0 ? 3 : 4);
const oddRows = (rows: number) => Array.from({ length: rows }, (_, i) => i).filter((i) => i % 2 === 1);
const bridgeRows = (rows: number, bridges: number) => oddRows(rows).slice(0, bridges);
const levelConfig = (n: number): Config => ({
  rows: n,
  fUnits: n,
  fDrones: n,
  eDrones: n - 1,
  eUnits: n - 1,
  civ: n * COLS + n,
  bridges: Math.floor(n / 2),
  maxActive: n * 2,
});

function buildGame(cfg: Config, randomize: boolean): Game {
  const rows = cfg.rows;
  const cells: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: COLS }, () => ({ rating: 1, activeTurns: 0, civ: 0, seq: 0, pinned: false })),
  );
  let id = 0;
  const mk = (side: Side, kind: Kind, rating: number, r: number, c: number): Unit => ({ id: id++, side, kind, rating, r, c });
  const units: Unit[] = [];
  const nf = Math.min(cfg.fUnits, rows);
  const nd = Math.min(cfg.fDrones, rows);
  const ned = Math.min(cfg.eDrones, rows);
  const neu = Math.min(cfg.eUnits, rows);
  for (let i = 0; i < nf; i++) units.push(mk("friendly", "human", 0, i, 0));
  for (let i = 0; i < nd; i++) units.push(mk("friendly", "drone", (i % 3) + 1, i, 1));
  for (let i = 0; i < ned; i++) units.push(mk("enemy", "drone", 0, i, COLS - 2));
  for (let i = 0; i < neu; i++) units.push(mk("enemy", "human", 0, i, COLS - 1));

  if (randomize) {
    const total = Math.max(0, Math.min(maxCivFor(rows), cfg.civ));
    const isDroneStart = (r: number, c: number) => c === 1 && r < nd;
    const weighted: [number, number][] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < COLS; c++) {
        weighted.push([r, c]);
        if (c === riverCol(r, rows)) weighted.push([r, c]); // river cells 2× likely
      }
    const place = (count: number, cap: (r: number, c: number) => number) => {
      let placed = 0;
      let guard = 0;
      while (placed < count && guard++ < 100000) {
        const [r, c] = weighted[Math.floor(Math.random() * weighted.length)];
        if (cells[r][c].civ < cap(r, c)) {
          cells[r][c].civ += 1;
          placed += 1;
        }
      }
    };
    let capReduced = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) capReduced += isDroneStart(r, c) ? 1 : MAX_CIV;
    const phase1 = Math.min(total, capReduced);
    place(phase1, (r, c) => (isDroneStart(r, c) ? 1 : MAX_CIV));
    if (total > phase1) place(total - phase1, () => MAX_CIV);
    // Guarantee at least one river cell holds the maximum civilians.
    const rc: [number, number][] = [];
    for (let r = 0; r < rows; r++) rc.push([r, riverCol(r, rows)]);
    if (!rc.some(([r, c]) => cells[r][c].civ >= MAX_CIV)) {
      let best = rc[0];
      for (const [r, c] of rc) if (cells[r][c].civ > cells[best[0]][best[1]].civ) best = [r, c];
      cells[best[0]][best[1]].civ = MAX_CIV;
    }
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) cells[r][c].rating = ratingFromCiv(cells[r][c].civ);
  let seqCounter = 0;
  for (let i = 0; i < nd; i++) {
    cells[i][1].activeTurns = 2; // start half-filled
    cells[i][1].seq = ++seqCounter;
  }
  const bridges = Math.max(0, Math.min(maxBridges(rows), cfg.bridges));
  return { cells, units, stats: { eu: 0, ed: 0, fu: 0, fd: 0, civF: 0, civE: 0, ticks: 0 }, status: "playing", bridges, seqCounter };
}

// Set a cell's clock, assigning FIFO order on activation and evicting the oldest over the
// cap. `pinned` marks a user activation, which the auto planner will not switch off.
function setClock(g: Game, r: number, c: number, turns: number, maxActive: number, pinned = false) {
  const cell = g.cells[r][c];
  const wasActive = cell.activeTurns > 0;
  cell.activeTurns = turns;
  if (turns > 0) {
    if (pinned) cell.pinned = true;
    if (!wasActive) {
      cell.seq = ++g.seqCounter;
      const active: Cell[] = [];
      for (const row of g.cells) for (const cc of row) if (cc.activeTurns > 0) active.push(cc);
      while (active.length > maxActive) {
        let oldest = active[0];
        for (const a of active) if (a.seq < oldest.seq) oldest = a;
        oldest.activeTurns = 0;
        oldest.seq = 0;
        oldest.pinned = false;
        active.splice(active.indexOf(oldest), 1);
      }
    }
  } else {
    cell.seq = 0;
    cell.pinned = false;
  }
}

const inB = (g: Game, r: number, c: number) => r >= 0 && c >= 0 && r < g.cells.length && c < g.cells[0].length;
const at = (g: Game, r: number, c: number) => g.units.filter((x) => x.r === r && x.c === c);
const opp = (s: Side): Side => (s === "friendly" ? "enemy" : "friendly");
// Any drone may enter any in-bounds cell; the overlay governs lethality, not movement.
function droneCanEnter(g: Game, u: Unit, r: number, c: number) {
  return inB(g, r, c);
}

function attackPhase(g: Game, kind: Kind) {
  const killed = new Set<number>();
  for (const a of g.units.filter((x) => x.kind === kind)) {
    if (killed.has(a.id)) continue;
    const cell = g.cells[a.r][a.c];
    // Fail closed: a friendly drone in a deactivated cell is non-lethal — present, able
    // to move, but it does not fire.
    if (a.side === "friendly" && a.kind === "drone" && cell.activeTurns <= 0) continue;
    const here = g.units.filter((x) => !killed.has(x.id) && x.r === a.r && x.c === a.c);
    const foes = here.filter((x) => x.side !== a.side);
    if (!foes.length) continue; // a unit only fires when a foe shares its cell
    const friends = here.filter((x) => x.side === a.side && x.id !== a.id);
    // Applied lethality: a friendly drone runs at the least lethal of its own setting and
    // the cell's cap; an enemy drone always runs at full lethality; any troop fires like a
    // medium drone.
    const level = a.kind === "drone" ? (a.side === "friendly" ? appliedLevel(a.rating, cell.rating) : 1) : 2;
    const L = LETHALITY[level];
    const civStat: "civF" | "civE" = a.side === "friendly" ? "civF" : "civE";
    // Three independent rolls: foe (flat), civilian (× count present), friend (× count present).
    if (Math.random() < L.foe) killed.add(foes[Math.floor(Math.random() * foes.length)].id);
    if (cell.civ > 0 && Math.random() < Math.min(1, L.civ * cell.civ)) {
      cell.civ -= 1;
      g.stats[civStat] += 1;
    }
    if (friends.length && Math.random() < Math.min(1, L.friend * friends.length)) {
      killed.add(friends[Math.floor(Math.random() * friends.length)].id);
    }
  }
  for (const idk of killed) {
    const v = g.units.find((x) => x.id === idk);
    if (!v) continue;
    if (v.side === "friendly") v.kind === "human" ? (g.stats.fu += 1) : (g.stats.fd += 1);
    else v.kind === "human" ? (g.stats.eu += 1) : (g.stats.ed += 1);
  }
  g.units = g.units.filter((x) => !killed.has(x.id));
}

function moveHumans(g: Game) {
  const rows = g.cells.length;
  const bRows = bridgeRows(rows, g.bridges);
  for (const u of g.units.filter((x) => x.kind === "human")) {
    const o = opp(u.side);
    const enemyDrones = g.units.filter((x) => x.side === o && x.kind === "drone");
    const oppUnits = g.units.filter((x) => x.side === o);
    const hasDrone = (r: number, c: number) => g.units.some((x) => x.kind === "drone" && x.r === r && x.c === c);
    const onRiver = u.c === riverCol(u.r, rows);
    const bridged = onRiver && bRows.includes(u.r);
    const blockedC = u.side === "friendly" ? u.c + 1 : u.c - 1;
    const passable = (r: number, c: number) => {
      if (!inB(g, r, c) || hasDrone(r, c)) return false;
      if (onRiver && !bridged && r === u.r && c === blockedC) return false;
      return true;
    };
    const nbrs = ORTHO.map(([dr, dc]) => ({ r: u.r + dr, c: u.c + dc })).filter((n) => passable(n.r, n.c));

    if (enemyDrones.some((d) => d.r === u.r && d.c === u.c)) {
      if (!nbrs.length) continue;
      const dist = (r: number, c: number) => Math.min(...enemyDrones.map((d) => Math.abs(d.r - r) + Math.abs(d.c - c)));
      let best: { r: number; c: number } | null = null;
      let bestD = dist(u.r, u.c);
      for (const n of nbrs) {
        const d = dist(n.r, n.c);
        if (d > bestD) {
          bestD = d;
          best = n;
        }
      }
      if (best) {
        u.r = best.r;
        u.c = best.c;
      }
      continue;
    }
    if (!oppUnits.length) continue;
    const near = oppUnits.reduce((a, b) =>
      Math.abs(a.r - u.r) + Math.abs(a.c - u.c) <= Math.abs(b.r - u.r) + Math.abs(b.c - u.c) ? a : b,
    );
    const dist = (r: number, c: number) => Math.abs(near.r - r) + Math.abs(near.c - c);
    const reducing = nbrs.filter((n) => dist(n.r, n.c) < dist(u.r, u.c));
    if (!reducing.length) continue;
    const foeAt = (r: number, c: number) => g.units.some((x) => x.side === o && x.r === r && x.c === c);
    const cleared = reducing.filter((n) => !foeAt(n.r, n.c));
    const pool = cleared.length ? cleared : reducing;
    const pick = pool.reduce((a, b) => (dist(a.r, a.c) <= dist(b.r, b.c) ? a : b));
    u.r = pick.r;
    u.c = pick.c;
  }
}

type Enter = (g: Game, u: Unit, r: number, c: number) => boolean;
type RC = { r: number; c: number };

// BFS toward the nearest enemy over cells `canEnter` admits; returns the whole path
// [first step, …, enemy cell], or [] if no enemy is reachable.
function dronePath(g: Game, u: Unit, canEnter: Enter): RC[] {
  const o = opp(u.side);
  const cols = g.cells[0].length;
  const key = (r: number, c: number) => r * cols + c;
  const prev = new Map<number, RC>();
  const seen = new Set<number>([key(u.r, u.c)]);
  const q: RC[] = [{ r: u.r, c: u.c }];
  let goal: RC | null = null;
  while (q.length) {
    const cur = q.shift()!;
    if ((cur.r !== u.r || cur.c !== u.c) && at(g, cur.r, cur.c).some((x) => x.side === o)) {
      goal = cur;
      break;
    }
    for (const [dr, dc] of DIRS8) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if (!canEnter(g, u, nr, nc) || seen.has(key(nr, nc))) continue;
      seen.add(key(nr, nc));
      prev.set(key(nr, nc), cur);
      q.push({ r: nr, c: nc });
    }
  }
  if (!goal) return [];
  const path: RC[] = [];
  let node: RC | undefined = goal;
  while (node && (node.r !== u.r || node.c !== u.c)) {
    path.push(node);
    node = prev.get(key(node.r, node.c));
  }
  return path.reverse();
}

const droneStep = (g: Game, u: Unit) => dronePath(g, u, droneCanEnter)[0] ?? null;

const AUTO_CLOCK = 4;

// Auto planning runs each tick right after the clocks tick down. Drones move on their
// own now, so the plan authorizes *engagement*, and it always spends the full active-zone
// budget: it lights the corridor from each drone toward its nearest enemy, then tops up
// with the cells closest to the enemy so we never sit with zones to spare. It never
// switches off a cell the user activated (those expire on their own clock).
function autoPlan(g: Game, maxActive: number) {
  if (g.status !== "playing") return;
  const rows = g.cells.length;
  const cols = g.cells[0].length;
  const key = (r: number, c: number) => r * cols + c;
  // User-pinned cells are held and still count against the budget.
  let pinned = 0;
  for (const row of g.cells) for (const cell of row) if (cell.activeTurns > 0 && cell.pinned) pinned++;
  const budget = Math.max(0, maxActive - pinned);

  const want = new Map<number, number>(); // key -> priority (lower = keep first)
  const bump = (r: number, c: number, p: number) => {
    if (!inB(g, r, c)) return;
    const cell = g.cells[r][c];
    if (cell.pinned && cell.activeTurns > 0) return; // already held by the user
    const k = key(r, c);
    const cur = want.get(k);
    if (cur === undefined || cur > p) want.set(k, p);
  };
  const enemies = g.units.filter((x) => x.side === "enemy");
  const enemyAt = (r: number, c: number) => inB(g, r, c) && at(g, r, c).some((x) => x.side === "enemy");
  // Corridor: light each drone's own cell (if it's on a foe) and every cell along its
  // shortest path to the nearest enemy — nearer steps first.
  for (const u of g.units.filter((x) => x.side === "friendly" && x.kind === "drone")) {
    if (enemyAt(u.r, u.c)) bump(u.r, u.c, 0);
    const path = dronePath(g, u, droneCanEnter);
    for (let i = 0; i < path.length; i++) bump(path[i].r, path[i].c, 1 + i);
  }
  // Top up to the full budget with the cells closest to the enemy front, so we always run
  // at the maximum number of active zones.
  if (enemies.length) {
    const distToEnemy = (r: number, c: number) =>
      Math.min(...enemies.map((e) => Math.max(Math.abs(e.r - r), Math.abs(e.c - c))));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) bump(r, c, 1000 + distToEnemy(r, c));
  }
  const keep = new Set([...want.entries()].sort((a, b) => a[1] - b[1]).slice(0, budget).map(([k]) => k));

  // Apply: light kept cells, switch off any auto cell that fell out of the plan.
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cell = g.cells[r][c];
      if (cell.pinned && cell.activeTurns > 0) continue; // leave user cells to time out
      if (keep.has(key(r, c))) {
        if (cell.activeTurns <= 0) {
          cell.activeTurns = AUTO_CLOCK;
          cell.seq = ++g.seqCounter;
        }
      } else if (cell.activeTurns > 0) {
        cell.activeTurns = 0;
        cell.seq = 0;
        cell.pinned = false;
      }
    }
}

function moveDrones(g: Game) {
  for (const u of g.units.filter((x) => x.kind === "drone")) {
    const o = opp(u.side);
    if (at(g, u.r, u.c).some((x) => x.side === o)) continue;
    const s = droneStep(g, u);
    if (s) {
      u.r = s.r;
      u.c = s.c;
    }
  }
}

function step(prev: Game): Game {
  const g: Game = structuredClone(prev);
  if (g.status !== "playing") return g;
  g.stats.ticks += 1;
  attackPhase(g, "drone");
  attackPhase(g, "human");
  moveHumans(g);
  moveDrones(g);
  for (const row of g.cells)
    for (const cell of row)
      if (cell.activeTurns > 0) {
        cell.activeTurns -= 1;
        if (cell.activeTurns === 0) {
          cell.seq = 0;
          cell.pinned = false;
        }
      }
  const enemy = g.units.filter((x) => x.side === "enemy").length;
  const friendly = g.units.filter((x) => x.side === "friendly").length;
  if (enemy === 0) g.status = "won";
  else if (friendly === 0) g.status = "lost";
  return g;
}

// Diff pre/post-step states into transient effects: who moved (origin→dest, side)
// and which cells saw a death (a removed unit, or a lost civilian).
function computeFx(before: Game, after: Game): Fx {
  const moves: FxMove[] = [];
  const afterById = new Map(after.units.map((u) => [u.id, u]));
  for (const b of before.units) {
    const a = afterById.get(b.id);
    if (a && (a.r !== b.r || a.c !== b.c)) moves.push({ fr: b.r, fc: b.c, tr: a.r, tc: a.c, side: b.side });
  }
  const afterIds = new Set(after.units.map((u) => u.id));
  const deadCells = new Set<string>();
  for (const b of before.units) if (!afterIds.has(b.id)) deadCells.add(`${b.r},${b.c}`);
  for (let r = 0; r < after.cells.length; r++)
    for (let c = 0; c < after.cells[0].length; c++)
      if (after.cells[r][c].civ < before.cells[r][c].civ) deadCells.add(`${r},${c}`);
  const deaths = [...deadCells].map((k) => {
    const [r, c] = k.split(",").map(Number);
    return { r, c };
  });
  return { moves, deaths };
}

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function River({ rows, bridges }: { rows: number; bridges: number }) {
  const cx = (c: number) => c * (CELL_W + GAP) + CELL_W / 2;
  const cy = (r: number) => r * (CELL_H + GAP) + CELL_H / 2;
  const w = COLS * CELL_W + (COLS - 1) * GAP;
  const h = rows * CELL_H + (rows - 1) * GAP;
  const pts = [{ x: cx(riverCol(0, rows)), y: 0 }];
  for (let r = 0; r < rows; r++) pts.push({ x: cx(riverCol(r, rows)), y: cy(r) });
  pts.push({ x: cx(riverCol(rows - 1, rows)), y: h });
  const bRows = bridgeRows(rows, bridges);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 5 }}>
      <path d={smoothPath(pts)} fill="none" stroke={RIVER_BLUE} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      {bRows.map((r) => (
        <rect key={r} x={cx(riverCol(r, rows)) - 18} y={cy(r) - 5} width={36} height={10} rx={2} fill="#A9763A" stroke="#5A3A1A" strokeWidth={1} />
      ))}
    </svg>
  );
}

// Transient overlay: movement arrows (unit-colored) and death skulls, shown ~1s per tick.
function FxLayer({ fx, rows }: { fx: Fx; rows: number }) {
  const cx = (c: number) => c * (CELL_W + GAP) + CELL_W / 2;
  const cy = (r: number) => r * (CELL_H + GAP) + CELL_H / 2;
  const w = COLS * CELL_W + (COLS - 1) * GAP;
  const h = rows * CELL_H + (rows - 1) * GAP;
  const col = (s: Side) => (s === "friendly" ? FRIENDLY_BLUE : "#C0392B");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 8 }}>
      {fx.moves.map((m, i) => {
        // A short, thick arrow straddling the boundary between origin and destination
        // (centered at the midpoint of the two cell centers), pointing toward the move.
        const ang = Math.atan2(cy(m.tr) - cy(m.fr), cx(m.tc) - cx(m.fc));
        const ux = Math.cos(ang);
        const uy = Math.sin(ang);
        const mx = (cx(m.fc) + cx(m.tc)) / 2;
        const my = (cy(m.fr) + cy(m.tr)) / 2;
        const half = 11; // half the shaft length
        const tailx = mx - half * ux;
        const taily = my - half * uy;
        const headx = mx + half * ux;
        const heady = my + half * uy;
        const ah = 13; // arrowhead length
        const p1x = headx - ah * Math.cos(ang - Math.PI / 6);
        const p1y = heady - ah * Math.sin(ang - Math.PI / 6);
        const p2x = headx - ah * Math.cos(ang + Math.PI / 6);
        const p2y = heady - ah * Math.sin(ang + Math.PI / 6);
        const c = col(m.side);
        return (
          <g key={i}>
            <line x1={tailx.toFixed(1)} y1={taily.toFixed(1)} x2={headx.toFixed(1)} y2={heady.toFixed(1)} stroke={c} strokeWidth={7} strokeLinecap="round" opacity={0.95} />
            <polygon points={`${headx.toFixed(1)},${heady.toFixed(1)} ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}`} fill={c} opacity={0.95} />
          </g>
        );
      })}
      {fx.deaths.map((d, i) => (
        <text key={`d${i}`} x={cx(d.c)} y={cy(d.r)} textAnchor="middle" dominantBaseline="central" fontSize={26}>
          💀
        </text>
      ))}
    </svg>
  );
}

function Clock({ n }: { n: number }) {
  const cx = 10;
  const cy = 10;
  const r = 8;
  let inner: React.ReactNode = null;
  if (n >= 4) inner = <circle cx={cx} cy={cy} r={r} fill="#444441" />;
  else if (n > 0) {
    const f = n / 4;
    const th = f * 2 * Math.PI;
    const ex = cx + r * Math.sin(th);
    const ey = cy - r * Math.cos(th);
    const large = f > 0.5 ? 1 : 0;
    inner = <path d={`M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 ${large} 1 ${ex.toFixed(2)},${ey.toFixed(2)} Z`} fill="#444441" />;
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke="#b4b2a9" strokeWidth="1" />
      {inner}
    </svg>
  );
}

function Marker({ u, onEdit, extra }: { u: Unit; onEdit?: () => void; extra?: React.CSSProperties }) {
  const friendly = u.side === "friendly";
  const drone = u.kind === "drone";
  const editable = friendly && drone && onEdit;
  const border = friendly && drone ? `4px solid ${RATING_COLOR[u.rating]}` : `2px solid ${BLACK}`;
  return (
    <span
      title={`${u.side} ${u.kind}${drone && friendly ? ` · lethality ${["", "G", "Y", "R"][u.rating]} (click to change)` : ""}`}
      onClick={editable ? (e) => { e.stopPropagation(); onEdit!(); } : undefined}
      style={{
        width: US,
        height: US,
        background: friendly ? FRIENDLY_BLUE : drone ? ENEMY_DRONE : ENEMY_HUMAN,
        borderRadius: drone ? "50%" : 2,
        border,
        boxSizing: "border-box",
        cursor: editable ? "pointer" : "default",
        ...extra,
      }}
    />
  );
}

function Stepper({ label, value, set, min, max, disabled }: { label: string; value: number; set: (v: number) => void; min: number; max: number; disabled: boolean }) {
  const b = "h-6 w-6 rounded border border-rule text-sm leading-none hover:bg-panel disabled:opacity-40";
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-32 text-xs text-muted">{label}</span>
      <button className={b} disabled={disabled || value <= min} onClick={() => set(value - 1)}>−</button>
      <span className="w-5 text-center text-sm font-bold tabular-nums text-ink">{value}</span>
      <button className={b} disabled={disabled || value >= max} onClick={() => set(value + 1)}>+</button>
    </div>
  );
}

const BOX: Record<string, { bg: string; border: string }> = {
  red: { bg: "#F5D6D5", border: "#C0392B" },
  blue: { bg: "#D6E6F7", border: "#2C6BB0" },
  grey: { bg: "#E4E2DB", border: "#7C7B74" },
};

export default function AutonomousTargetingGame() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [game, setGame] = useState<Game>(() => buildGame(DEFAULT_CONFIG, false));
  const [running, setRunning] = useState(false);
  const [auto, setAuto] = useState(false);
  const [fx, setFx] = useState<Fx>(NO_FX);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pending = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const fxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef(auto);
  autoRef.current = auto;
  const maxActiveRef = useRef(config.maxActive);
  maxActiveRef.current = config.maxActive;
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    setGame(buildGame(DEFAULT_CONFIG, true));
  }, []);

  useEffect(() => () => { if (fxTimer.current) clearTimeout(fxTimer.current); }, []);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      const g = gameRef.current;
      if (g.status !== "playing") return;
      const n = step(g);
      if (autoRef.current) autoPlan(n, maxActiveRef.current);
      const nextFx = computeFx(g, n);
      gameRef.current = n;
      setGame(n);
      setFx(nextFx);
      if (fxTimer.current) clearTimeout(fxTimer.current);
      fxTimer.current = setTimeout(() => setFx(NO_FX), 1000);
    }, STEP_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  useEffect(() => {
    if (game.status !== "playing") setRunning(false);
  }, [game.status]);

  // Setup phase: before the game has started. Civilian counts may only be edited here;
  // drone lethality, cell caps, and timers stay adjustable throughout play.
  const setup = !running && game.stats.ticks === 0;

  const applyConfig = (n: Config) => {
    const rows = Math.max(2, Math.min(10, n.rows));
    const next: Config = {
      rows,
      fUnits: Math.max(1, Math.min(n.fUnits, rows)),
      fDrones: Math.max(1, Math.min(n.fDrones, rows)),
      eDrones: Math.max(1, Math.min(n.eDrones, rows)),
      eUnits: Math.max(1, Math.min(n.eUnits, rows)),
      civ: Math.max(1, Math.min(maxCivFor(rows), n.civ)),
      bridges: Math.max(0, Math.min(maxBridges(rows), n.bridges)),
      maxActive: Math.max(1, Math.min(rows * COLS, n.maxActive)),
    };
    setConfig(next);
    setRunning(false);
    setAuto(false);
    if (fxTimer.current) clearTimeout(fxTimer.current);
    setFx(NO_FX);
    setGame(buildGame(next, true));
  };
  const toggleAuto = () => {
    if (!auto) {
      setAuto(true);
      setRunning(true);
    } else {
      setAuto(false);
    }
  };
  const setForce = (k: keyof Config, v: number) => {
    setSelectedLevel(null); // any manual config change clears the level highlight
    applyConfig(
      k === "fDrones"
        ? { ...config, fDrones: v, maxActive: v * 2 }
        : k === "rows"
          ? { ...config, rows: v, civ: v * COLS }
          : { ...config, [k]: v },
    );
  };

  const clickCell = (r: number, c: number) => {
    const key = `${r}-${c}`;
    if (pending.current[key]) {
      clearTimeout(pending.current[key]);
      delete pending.current[key];
      // double click → toggle between 4 and 0
      setGame((g) => {
        const n: Game = structuredClone(g);
        setClock(n, r, c, n.cells[r][c].activeTurns === 4 ? 0 : 4, config.maxActive, true);
        return n;
      });
    } else {
      pending.current[key] = setTimeout(() => {
        delete pending.current[key];
        // single click → step the clock by one (4 wraps to 0)
        setGame((g) => {
          const n: Game = structuredClone(g);
          setClock(n, r, c, (n.cells[r][c].activeTurns + 1) % 5, config.maxActive, true);
          return n;
        });
      }, 230);
    }
  };
  const cycleRating = (r: number, c: number) =>
    setGame((g) => {
      const n: Game = structuredClone(g);
      n.cells[r][c].rating = (n.cells[r][c].rating % 3) + 1;
      return n;
    });
  const editDrone = (id: number) =>
    setGame((g) => {
      const n: Game = structuredClone(g);
      const u = n.units.find((x) => x.id === id);
      if (u) u.rating = (u.rating % 3) + 1;
      return n;
    });
  const cycleCiv = (r: number, c: number) =>
    setGame((g) => {
      const n: Game = structuredClone(g);
      const cell = n.cells[r][c];
      cell.civ = cell.civ < MAX_CIV ? cell.civ + 1 : 0;
      return n;
    });

  const btn = "rounded border border-rule px-3 py-1.5 text-sm hover:bg-panel disabled:opacity-40";
  const s = game.stats;
  const activeCount = game.cells.reduce((sum, row) => sum + row.filter((x) => x.activeTurns > 0).length, 0);
  const boxes: [string, number, string][] = [
    ["Enemy troops killed", s.eu, "red"],
    ["Friendly troops killed", s.fu, "blue"],
    ["Civilians killed (your fire)", s.civF, "grey"],
    ["Enemy drones killed", s.ed, "red"],
    ["Friendly drones killed", s.fd, "blue"],
    ["Civilians killed (enemy fire)", s.civE, "grey"],
  ];
  const totalScore = s.eu + s.ed - (s.fu + s.fd) - (s.civF + s.civE);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Prototype</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Autonomy Zone</h1>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        You command the region but control no forces — only the overlay and the
        drones&apos; settings. Every drone can fire at any lethality: its colored
        border and each cell&apos;s corner triangle both set a level (green most
        lethal → red least), and what applies is the <em>least lethal</em> of the
        two — a red cell throttles a green drone, and a red drone throttles a
        green cell. So you can hold fire either by managing the battlefield or by
        managing the drones. A deactivated cell is non-lethal: drones may cross it
        but won&apos;t fire (fail-closed). Single-click a cell to step its
        authorization clock (wraps 4 → 0), double-click to jump 4 ↔ 0; click a
        drone to change its lethality. Troops move on their own and fire like a
        medium drone, but still cross the river only at a bridge; enemies ignore
        the overlay. Press
        Auto to let the system authorize engagement where your drones meet the
        enemy — it won&apos;t switch off cells you activated yourself; those
        expire on their own clock.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRunning((v) => !v)}
          disabled={game.status !== "playing"}
          style={{ background: "#C6E9B0", border: "1px solid #7FB05B", color: "#2f5417", borderRadius: 8 }}
          className="px-4 py-1.5 text-sm font-bold hover:brightness-95 disabled:opacity-40"
        >
          {running ? "❚❚ Pause" : "▶ Play"}
        </button>
        <button
          onClick={toggleAuto}
          disabled={game.status !== "playing"}
          title="Auto: the overlay keeps activating the cells your drones want to advance into as older zones expire"
          style={
            auto
              ? { background: "#378ADD", border: "1px solid #2C6BB0", color: "#ffffff", borderRadius: 8 }
              : { background: "#D6E6F7", border: "1px solid #2C6BB0", color: "#1c4c86", borderRadius: 8 }
          }
          className="px-4 py-1.5 text-sm font-bold hover:brightness-95 disabled:opacity-40"
        >
          {auto ? "◉ Auto" : "◎ Auto"}
        </button>
        {LEVELS.map((l) => (
          <button
            key={l}
            className={btn}
            disabled={running}
            onClick={() => { applyConfig(levelConfig(l + 1)); setSelectedLevel(l); }}
            style={selectedLevel === l ? { borderColor: BLACK, borderWidth: 3, fontWeight: 700 } : undefined}
          >
            Lvl {l}
          </button>
        ))}
        <span className="text-sm text-muted">tick {game.stats.ticks} · active {activeCount}/{config.maxActive}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center" style={{ width: GAME_W, maxWidth: "100%" }}>
        {boxes.map(([label, val, c]) => (
          <div key={label} style={{ background: BOX[c].bg, border: `2px solid ${BOX[c].border}`, borderRadius: 6 }} className="px-2 py-1.5">
            <p className="text-[10px] font-bold leading-tight" style={{ color: BOX[c].border }}>{label}</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-ink">{val}</p>
          </div>
        ))}
      </div>

      <div
        className="mt-2 flex items-center justify-between px-3 py-2"
        style={{ width: GAME_W, maxWidth: "100%", background: "#F1EFE8", border: `2px solid ${BLACK}`, borderRadius: 6 }}
      >
        <span className="text-[11px] font-bold text-ink">
          Total score = enemy killed − friendly killed − civilians killed
        </span>
        <span className="text-2xl font-bold tabular-nums" style={{ color: totalScore >= 0 ? "#3B6D11" : "#A32D2D" }}>
          {totalScore}
        </span>
      </div>

      {game.status !== "playing" && (
        <p
          className="mt-3 border-l-4 px-4 py-3 text-sm font-bold text-ink"
          style={{
            borderColor: game.status === "won" ? "#639922" : "#E24B4A",
            background: game.status === "won" ? "rgba(151,196,89,0.15)" : "rgba(240,149,149,0.2)",
          }}
        >
          {game.status === "won"
            ? `Enemy destroyed in ${game.stats.ticks} ticks — ${s.civF + s.civE} civilian casualties.`
            : "Friendly forces wiped out."}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <div style={{ border: `5px solid ${BLACK}`, borderRadius: 12, padding: FRAME_PAD, display: "inline-block", background: "#fff" }}>
          <div style={{ position: "relative" }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${CELL_W}px)`, gap: GAP, width: "max-content" }}>
              {game.cells.map((row, r) =>
                row.map((cell, c) => {
                  const active = cell.activeTurns > 0;
                  const units = at(game, r, c);
                  const fd = units.filter((u) => u.side === "friendly" && u.kind === "drone");
                  const ed = units.filter((u) => u.side === "enemy" && u.kind === "drone");
                  const fh = units.filter((u) => u.side === "friendly" && u.kind === "human");
                  const eh = units.filter((u) => u.side === "enemy" && u.kind === "human");
                  const lane = (arr: Unit[], top: number, fromLeft: boolean) =>
                    arr.map((u, i) => (
                      <Marker
                        key={u.id}
                        u={u}
                        onEdit={() => editDrone(u.id)}
                        extra={{ position: "absolute", top, zIndex: i + 1, ...(fromLeft ? { left: 3 + i * HALF } : { right: 3 + i * HALF }) }}
                      />
                    ));
                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => clickCell(r, c)}
                      style={{
                        position: "relative",
                        height: CELL_H,
                        cursor: "pointer",
                        background: active ? RATING_TINT[cell.rating] : "#ffffff",
                        border: `2px ${active ? "solid" : "dashed"} ${RATING_COLOR[cell.rating]}`,
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        onClick={(e) => { e.stopPropagation(); cycleRating(r, c); }}
                        title="cell lethality cap — green most lethal, red least (cycles G/Y/R)"
                        style={{ position: "absolute", top: -2, left: -2, width: 24, height: 24, background: RATING_COLOR[cell.rating], clipPath: "polygon(0 0, 100% 0, 0 100%)", cursor: "pointer", zIndex: 3 }}
                      />
                      <span style={{ position: "absolute", top: 2, right: 2, pointerEvents: "none" }}>
                        <Clock n={cell.activeTurns} />
                      </span>
                      {lane(fd, DRONE_TOP, true)}
                      {lane(ed, DRONE_TOP, false)}
                      {lane(fh, HUMAN_TOP, true)}
                      {lane(eh, HUMAN_TOP, false)}
                      <div
                        onClick={setup ? (e) => { e.stopPropagation(); cycleCiv(r, c); } : undefined}
                        title={setup ? "click to add a civilian (removes all at 4)" : undefined}
                        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 18, display: "flex", alignItems: "flex-end", gap: 2, paddingLeft: 3, paddingBottom: 3, cursor: setup ? "pointer" : "inherit" }}
                      >
                        {Array.from({ length: cell.civ }, (_, i) => (
                          <span key={i} style={{ width: 11, height: 11, background: "#9b9a92", borderRadius: 1 }} />
                        ))}
                      </div>
                    </div>
                  );
                }),
              )}
            </div>
            <River rows={game.cells.length} bridges={game.bridges} />
            <FxLayer fx={fx} rows={game.cells.length} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted sm:grid-cols-5" style={{ maxWidth: GAME_W }}>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 13, height: 13, background: FRIENDLY_BLUE, border: `2px solid ${BLACK}`, display: "inline-block", borderRadius: 2, boxSizing: "border-box" }} />
          friendly troop
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 13, height: 13, background: ENEMY_HUMAN, border: `2px solid ${BLACK}`, display: "inline-block", borderRadius: 2, boxSizing: "border-box" }} />
          enemy troop
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 22, height: 3, background: RIVER_BLUE, display: "inline-block" }} />
          river
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 14, background: RATING_COLOR[1], clipPath: "polygon(0 0, 100% 0, 0 100%)", display: "inline-block" }} />
          most lethal (G)
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 14, background: RATING_COLOR[2], clipPath: "polygon(0 0, 100% 0, 0 100%)", display: "inline-block" }} />
          medium (Y)
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 14, background: FRIENDLY_BLUE, borderRadius: "50%", border: "3px solid #639922", display: "inline-block", boxSizing: "border-box" }} />
          friendly drone (border = lethality)
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 13, height: 13, background: ENEMY_DRONE, border: `2px solid ${BLACK}`, borderRadius: "50%", display: "inline-block", boxSizing: "border-box" }} />
          enemy drone
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 8, background: "#A9763A", border: "1px solid #5A3A1A", display: "inline-block" }} />
          bridge
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 14, background: RATING_COLOR[3], clipPath: "polygon(0 0, 100% 0, 0 100%)", display: "inline-block" }} />
          least lethal (R)
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 11, height: 11, background: "#9b9a92", borderRadius: 1, display: "inline-block" }} />
          civilian
        </span>
      </div>

      <div className="section-rule mt-6 flex flex-col gap-2 pt-4">
        <Stepper label="Rows" value={config.rows} min={2} max={10} disabled={running} set={(v) => setForce("rows", v)} />
        <Stepper label="Friendly units" value={config.fUnits} min={1} max={config.rows} disabled={running} set={(v) => setForce("fUnits", v)} />
        <Stepper label="Friendly drones" value={config.fDrones} min={1} max={config.rows} disabled={running} set={(v) => setForce("fDrones", v)} />
        <Stepper label="Enemy drones" value={config.eDrones} min={1} max={config.rows} disabled={running} set={(v) => setForce("eDrones", v)} />
        <Stepper label="Enemy units" value={config.eUnits} min={1} max={config.rows} disabled={running} set={(v) => setForce("eUnits", v)} />
        <Stepper label="Bridges" value={config.bridges} min={0} max={maxBridges(config.rows)} disabled={running} set={(v) => setForce("bridges", v)} />
        <Stepper label="Max active zones" value={config.maxActive} min={1} max={config.rows * COLS} disabled={running} set={(v) => setForce("maxActive", v)} />
        <div className="flex items-center gap-1.5">
          <span className="w-32 text-xs text-muted">Civilians</span>
          <input
            type="range"
            min={1}
            max={maxCivFor(config.rows)}
            value={config.civ}
            disabled={running}
            onChange={(e) => setForce("civ", Number(e.target.value))}
            className="w-48"
          />
          <span className="w-10 text-sm font-bold tabular-nums text-ink">{config.civ}</span>
        </div>
      </div>
    </div>
  );
}

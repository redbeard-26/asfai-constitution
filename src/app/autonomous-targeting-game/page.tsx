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
const DRONE_PRECISION: Record<number, number> = { 1: 0.75, 2: 0.88, 3: 0.97 };
const HUMAN_PRECISION = 0.88;
const KILL = { drone: 0.42, human: 0.3 };
const FF = { drone: 0.04, human: 0.02 };
const MAX_CIV = 4;
const ENEMY_HUMAN = "#9C4A2E"; // brown-red
const ENEMY_DRONE = "#C0503C"; // lighter red-brown
const RIVER_BLUE = "#2C7BD6";
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

type Cell = { rating: number; activeTurns: number; civ: number; seq: number };
type Side = "friendly" | "enemy";
type Kind = "human" | "drone";
type Unit = { id: number; side: Side; kind: Kind; rating: number; r: number; c: number };
type Status = "playing" | "won" | "lost";
type Stats = { eu: number; ed: number; fu: number; fd: number; civF: number; civE: number; ticks: number };
type Game = { cells: Cell[][]; units: Unit[]; stats: Stats; status: Status; bridges: number; seqCounter: number };
type Config = { rows: number; fUnits: number; fDrones: number; eDrones: number; eUnits: number; civ: number; bridges: number; maxActive: number };

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
    Array.from({ length: COLS }, () => ({ rating: 1, activeTurns: 0, civ: 0, seq: 0 })),
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

// Set a cell's clock, assigning FIFO order on activation and evicting the oldest over the cap.
function setClock(g: Game, r: number, c: number, turns: number, maxActive: number) {
  const cell = g.cells[r][c];
  const wasActive = cell.activeTurns > 0;
  cell.activeTurns = turns;
  if (turns > 0) {
    if (!wasActive) {
      cell.seq = ++g.seqCounter;
      const active: Cell[] = [];
      for (const row of g.cells) for (const cc of row) if (cc.activeTurns > 0) active.push(cc);
      while (active.length > maxActive) {
        let oldest = active[0];
        for (const a of active) if (a.seq < oldest.seq) oldest = a;
        oldest.activeTurns = 0;
        oldest.seq = 0;
        active.splice(active.indexOf(oldest), 1);
      }
    }
  } else {
    cell.seq = 0;
  }
}

const inB = (g: Game, r: number, c: number) => r >= 0 && c >= 0 && r < g.cells.length && c < g.cells[0].length;
const at = (g: Game, r: number, c: number) => g.units.filter((x) => x.r === r && x.c === c);
const opp = (s: Side): Side => (s === "friendly" ? "enemy" : "friendly");
const civPrecision = (a: Unit) =>
  a.kind === "drone" ? (a.side === "friendly" ? DRONE_PRECISION[a.rating] : DRONE_PRECISION[1]) : HUMAN_PRECISION;

function droneCanEnter(g: Game, u: Unit, r: number, c: number) {
  if (!inB(g, r, c)) return false;
  if (u.side === "enemy") return true;
  const cell = g.cells[r][c];
  return cell.activeTurns > 0 && cell.rating <= u.rating;
}

function attackPhase(g: Game, kind: Kind) {
  const killed = new Set<number>();
  for (const a of g.units.filter((x) => x.kind === kind)) {
    if (killed.has(a.id)) continue;
    if (a.side === "friendly" && a.kind === "drone" && g.cells[a.r][a.c].activeTurns <= 0) continue;
    const here = g.units.filter((x) => !killed.has(x.id) && x.r === a.r && x.c === a.c);
    const foes = here.filter((x) => x.side !== a.side);
    const friends = here.filter((x) => x.side === a.side && x.id !== a.id);
    const kill = a.kind === "drone" ? KILL.drone : KILL.human;
    const ff = a.kind === "drone" ? FF.drone : FF.human;
    if (foes.length && Math.random() < kill) killed.add(foes[Math.floor(Math.random() * foes.length)].id);
    if (friends.length && Math.random() < ff) killed.add(friends[Math.floor(Math.random() * friends.length)].id);
    const cell = g.cells[a.r][a.c];
    if (cell.civ > 0) {
      const pCiv = (1 - civPrecision(a)) * (cell.civ / MAX_CIV);
      if (Math.random() < pCiv) {
        cell.civ -= 1;
        a.side === "friendly" ? (g.stats.civF += 1) : (g.stats.civE += 1);
      }
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
      if (u.side === "friendly" && g.cells[r][c].activeTurns <= 0) return false;
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

function droneStep(g: Game, u: Unit): { r: number; c: number } | null {
  const o = opp(u.side);
  const cols = g.cells[0].length;
  const key = (r: number, c: number) => r * cols + c;
  const prev = new Map<number, { r: number; c: number }>();
  const seen = new Set<number>([key(u.r, u.c)]);
  const q: { r: number; c: number }[] = [{ r: u.r, c: u.c }];
  let goal: { r: number; c: number } | null = null;
  while (q.length) {
    const cur = q.shift()!;
    if ((cur.r !== u.r || cur.c !== u.c) && at(g, cur.r, cur.c).some((x) => x.side === o)) {
      goal = cur;
      break;
    }
    for (const [dr, dc] of DIRS8) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if (!droneCanEnter(g, u, nr, nc) || seen.has(key(nr, nc))) continue;
      seen.add(key(nr, nc));
      prev.set(key(nr, nc), cur);
      q.push({ r: nr, c: nc });
    }
  }
  if (!goal) return null;
  let node = goal;
  while (true) {
    const p = prev.get(key(node.r, node.c));
    if (!p || (p.r === u.r && p.c === u.c)) break;
    node = p;
  }
  return node;
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
        if (cell.activeTurns === 0) cell.seq = 0;
      }
  const enemy = g.units.filter((x) => x.side === "enemy").length;
  const friendly = g.units.filter((x) => x.side === "friendly").length;
  if (enemy === 0) g.status = "won";
  else if (friendly === 0) g.status = "lost";
  return g;
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
  const border = friendly && drone ? `2px solid ${RATING_COLOR[u.rating]}` : `2px solid ${BLACK}`;
  return (
    <span
      title={`${u.side} ${u.kind}${drone && friendly ? ` · rated ${["", "G", "Y", "P"][u.rating]}` : ""}`}
      onClick={editable ? (e) => { e.stopPropagation(); onEdit!(); } : undefined}
      style={{
        width: US,
        height: US,
        background: friendly ? "#378ADD" : drone ? ENEMY_DRONE : ENEMY_HUMAN,
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
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pending = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setGame(buildGame(DEFAULT_CONFIG, true));
  }, []);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => setGame((g) => (g.status === "playing" ? step(g) : g)), STEP_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  useEffect(() => {
    if (game.status !== "playing") setRunning(false);
  }, [game.status]);

  const setup = game.stats.ticks === 0;

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
    setGame(buildGame(next, true));
  };
  const setForce = (k: keyof Config, v: number) =>
    applyConfig(
      k === "fDrones"
        ? { ...config, fDrones: v, maxActive: v * 2 }
        : k === "rows"
          ? { ...config, rows: v, civ: v * COLS }
          : { ...config, [k]: v },
    );

  const clickCell = (r: number, c: number) => {
    const key = `${r}-${c}`;
    if (pending.current[key]) {
      clearTimeout(pending.current[key]);
      delete pending.current[key];
      // double click → toggle between 4 and 0
      setGame((g) => {
        const n: Game = structuredClone(g);
        setClock(n, r, c, n.cells[r][c].activeTurns === 4 ? 0 : 4, config.maxActive);
        return n;
      });
    } else {
      pending.current[key] = setTimeout(() => {
        delete pending.current[key];
        // single click → step the clock by one (4 wraps to 0)
        setGame((g) => {
          const n: Game = structuredClone(g);
          setClock(n, r, c, (n.cells[r][c].activeTurns + 1) % 5, config.maxActive);
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
    ["Enemy units killed", s.eu, "red"],
    ["Friendly units killed", s.fu, "blue"],
    ["Civilians killed (your fire)", s.civF, "grey"],
    ["Enemy drones killed", s.ed, "red"],
    ["Friendly drones killed", s.fd, "blue"],
    ["Civilians killed (enemy fire)", s.civE, "grey"],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Prototype</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Autonomy Zone</h1>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        You command the region but control no forces — only the overlay. The
        top-left swatch sets a cell&apos;s rating requirement; single-click a
        cell to step its authorization clock up by one turn (it wraps 4 → 0),
        double-click to jump between 4 and 0. Newly authorizing past your active
        limit deactivates the oldest zone. Friendly drones enter only active
        cells rated at or below their certification; troops enter any active
        cell; enemies ignore the overlay. Troops cross the river only at a
        bridge. Before pressing play, click a friendly drone to change its
        rating.
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
        {LEVELS.map((l) => (
          <button key={l} className={btn} disabled={running} onClick={() => applyConfig(levelConfig(l + 1))}>
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
                        onEdit={setup ? () => editDrone(u.id) : undefined}
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
                        title="rating requirement (cycles green/yellow/purple)"
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
                        onClick={(e) => { e.stopPropagation(); cycleCiv(r, c); }}
                        title="click to add a civilian (removes all at 4)"
                        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 18, display: "flex", alignItems: "flex-end", gap: 2, paddingLeft: 3, paddingBottom: 3, cursor: "pointer" }}
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
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted sm:grid-cols-5" style={{ maxWidth: GAME_W }}>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 13, height: 13, background: "#378ADD", border: `2px solid ${BLACK}`, display: "inline-block", borderRadius: 2, boxSizing: "border-box" }} />
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
          permissive (G)
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 14, height: 14, background: RATING_COLOR[2], clipPath: "polygon(0 0, 100% 0, 0 100%)", display: "inline-block" }} />
          medium (Y)
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 13, height: 13, background: "#378ADD", borderRadius: "50%", border: "2px solid #639922", display: "inline-block", boxSizing: "border-box" }} />
          friendly drone (border = rating)
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
          restrictive (R)
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

"use client";

import { useEffect, useRef, useState } from "react";

// ── Board ────────────────────────────────────────────────────────────────
const ROWS = 5;
const COLS = 8;
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

// ── Tuning ───────────────────────────────────────────────────────────────
const RATING_COLOR: Record<number, string> = { 1: "#639922", 2: "#EF9F27", 3: "#E24B4A" };
const RATING_TINT: Record<number, string> = {
  1: "rgba(151,196,89,0.50)",
  2: "rgba(239,159,39,0.42)",
  3: "rgba(240,149,149,0.55)",
};
const RATING_LETTER: Record<number, string> = { 1: "G", 2: "Y", 3: "R" };
// Friendly drone/human targeting precision → drives collateral. Higher rating = cleaner.
const DRONE_PRECISION: Record<number, number> = { 1: 0.75, 2: 0.9, 3: 0.97 };
const HUMAN_PRECISION = 0.85;
// Per-tick probability an attacker destroys one foe / one friendly (friendly fire) in its cell.
const KILL = { drone: 0.42, human: 0.3 };
const FF = { drone: 0.04, human: 0.02 };

type Cell = { active: boolean; rating: number; civ: number };
type Side = "friendly" | "enemy";
type Kind = "human" | "drone";
type Unit = { id: number; side: Side; kind: Kind; rating: number; r: number; c: number };
type Status = "playing" | "won" | "lost";
type Game = {
  cells: Cell[][];
  units: Unit[];
  stats: { enemyKilled: number; friendlyKilled: number; civ: number; ticks: number };
  status: Status;
};

function makeGame(): Game {
  const cells: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ active: false, rating: 1, civ: 0 })),
  );
  // A village (civilians) in the east-centre, plus scattered presence.
  cells[1][5].civ = 3;
  cells[2][5].civ = 3;
  cells[1][6].civ = 3;
  cells[2][6].civ = 4;
  cells[0][4].civ = 1;
  cells[3][6].civ = 1;

  let id = 0;
  const u = (side: Side, kind: Kind, rating: number, r: number, c: number): Unit => ({
    id: id++,
    side,
    kind,
    rating,
    r,
    c,
  });
  const units: Unit[] = [
    // friendly ground (west)
    u("friendly", "human", 0, 1, 0),
    u("friendly", "human", 0, 2, 0),
    u("friendly", "human", 0, 3, 0),
    // friendly drones — mixed ratings (green/green/yellow/red)
    u("friendly", "drone", 1, 0, 1),
    u("friendly", "drone", 1, 1, 1),
    u("friendly", "drone", 2, 2, 1),
    u("friendly", "drone", 3, 3, 1),
    // enemy ground (east; one garrison in the village)
    u("enemy", "human", 0, 1, 7),
    u("enemy", "human", 0, 3, 7),
    u("enemy", "human", 0, 2, 6),
    // enemy drones
    u("enemy", "drone", 0, 0, 6),
    u("enemy", "drone", 0, 2, 7),
  ];
  return { cells, units, stats: { enemyKilled: 0, friendlyKilled: 0, civ: 0, ticks: 0 }, status: "playing" };
}

// ── Helpers ──────────────────────────────────────────────────────────────
const inB = (r: number, c: number) => r >= 0 && c >= 0 && r < ROWS && c < COLS;
const at = (g: Game, r: number, c: number) => g.units.filter((x) => x.r === r && x.c === c);
const opp = (s: Side): Side => (s === "friendly" ? "enemy" : "friendly");

// Friendly drone may enter an active cell whose rating requirement ≤ its rating.
function droneCanEnter(g: Game, u: Unit, r: number, c: number) {
  if (!inB(r, c)) return false;
  if (u.side === "enemy") return true;
  const cell = g.cells[r][c];
  return cell.active && cell.rating <= u.rating;
}

function attackPhase(g: Game, kind: Kind) {
  const killed = new Set<number>();
  for (const a of g.units.filter((x) => x.kind === kind)) {
    if (killed.has(a.id)) continue;
    const here = g.units.filter((x) => !killed.has(x.id) && x.r === a.r && x.c === a.c);
    const foes = here.filter((x) => x.side !== a.side);
    const friends = here.filter((x) => x.side === a.side && x.id !== a.id);
    const kill = a.kind === "drone" ? KILL.drone : KILL.human;
    const ff = a.kind === "drone" ? FF.drone : FF.human;
    if (foes.length && Math.random() < kill) killed.add(foes[Math.floor(Math.random() * foes.length)].id);
    if (friends.length && Math.random() < ff) killed.add(friends[Math.floor(Math.random() * friends.length)].id);
    // Only friendly forces put civilians at risk — the player's authorizations.
    if (a.side === "friendly") {
      const cell = g.cells[a.r][a.c];
      if (cell.civ > 0) {
        const prec = a.kind === "drone" ? DRONE_PRECISION[a.rating] : HUMAN_PRECISION;
        const pCiv = (1 - prec) * (cell.civ / 3);
        if (Math.random() < pCiv) {
          cell.civ -= 1;
          g.stats.civ += 1;
        }
      }
    }
  }
  for (const idk of killed) {
    const v = g.units.find((x) => x.id === idk);
    if (v) v.side === "enemy" ? (g.stats.enemyKilled += 1) : (g.stats.friendlyKilled += 1);
  }
  g.units = g.units.filter((x) => !killed.has(x.id));
}

function moveHumans(g: Game) {
  for (const u of g.units.filter((x) => x.kind === "human")) {
    const o = opp(u.side);
    const enemyDrones = g.units.filter((x) => x.side === o && x.kind === "drone");
    const oppUnits = g.units.filter((x) => x.side === o);
    const hasDrone = (r: number, c: number) => g.units.some((x) => x.kind === "drone" && x.r === r && x.c === c);
    const passable = (r: number, c: number) => {
      if (!inB(r, c) || hasDrone(r, c)) return false;
      if (u.side === "friendly" && !g.cells[r][c].active) return false;
      return true;
    };
    const nbrs = ORTHO.map(([dr, dc]) => ({ r: u.r + dr, c: u.c + dc })).filter((n) => passable(n.r, n.c));

    if (enemyDrones.some((d) => d.r === u.r && d.c === u.c)) {
      // retreat: maximise distance from enemy drones
      if (!nbrs.length) continue;
      const dist = (r: number, c: number) => Math.min(...enemyDrones.map((d) => Math.abs(d.r - r) + Math.abs(d.c - c)));
      let best = null as null | { r: number; c: number };
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
    // advance toward nearest foe, preferring cells already cleared of foes
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
  const key = (r: number, c: number) => r * COLS + c;
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
    if (at(g, u.r, u.c).some((x) => x.side === o)) continue; // hold if a foe shares the cell
    const s = droneStep(g, u);
    if (s) {
      u.r = s.r;
      u.c = s.c;
    }
  }
}

function step(prevGame: Game): Game {
  const g: Game = structuredClone(prevGame);
  if (g.status !== "playing") return g;
  g.stats.ticks += 1;
  attackPhase(g, "drone");
  attackPhase(g, "human");
  moveHumans(g);
  moveDrones(g);
  const enemy = g.units.filter((x) => x.side === "enemy").length;
  const friendly = g.units.filter((x) => x.side === "friendly").length;
  if (enemy === 0) g.status = "won";
  else if (friendly === 0) g.status = "lost";
  return g;
}

// ── Markers ──────────────────────────────────────────────────────────────
function Marker({ u }: { u: Unit }) {
  const friendly = u.side === "friendly";
  const bg = friendly ? "#378ADD" : "#C0392B";
  const drone = u.kind === "drone";
  return (
    <span
      title={`${u.side} ${u.kind}${drone && friendly ? ` · rated ${RATING_LETTER[u.rating]}` : ""}`}
      style={{
        display: "inline-block",
        width: 15,
        height: 15,
        background: bg,
        borderRadius: drone ? "50%" : 2,
        border: drone && friendly ? `2px solid ${RATING_COLOR[u.rating]}` : "none",
        boxSizing: "border-box",
      }}
    />
  );
}

export default function AutonomousTargetingGame() {
  const [game, setGame] = useState<Game>(makeGame);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setGame((g) => (g.status === "playing" ? step(g) : g));
    }, 2000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  useEffect(() => {
    if (game.status !== "playing") setRunning(false);
  }, [game.status]);

  const cycleRating = (r: number, c: number) =>
    setGame((g) => {
      const n: Game = structuredClone(g);
      n.cells[r][c].rating = (n.cells[r][c].rating % 3) + 1;
      return n;
    });
  const toggleActive = (r: number, c: number) =>
    setGame((g) => {
      const n: Game = structuredClone(g);
      n.cells[r][c].active = !n.cells[r][c].active;
      return n;
    });

  const enemyLeft = game.units.filter((u) => u.side === "enemy").length;
  const friendlyLeft = game.units.filter((u) => u.side === "friendly").length;

  const btn =
    "rounded border border-rule px-3 py-1.5 text-sm hover:bg-panel disabled:opacity-40";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Prototype</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Autonomy Zone — game
        </h1>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        You command the region but control no forces — only the overlay. Give each
        cell a rating requirement (G/Y/R) and switch it on or off. Friendly drones
        may only enter active cells rated at or below their own certification;
        friendly troops may enter any active cell. Enemies ignore your overlay.
        Every tick, units in a cell fire on each other — precise (red-rated) drones
        rarely hit civilians; blunt (green-rated) ones often do. Destroy the enemy;
        spare the civilians.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button className={btn} onClick={() => setRunning((r) => !r)} disabled={game.status !== "playing"}>
          {running ? "Pause" : "Play"}
        </button>
        <button
          className={btn}
          onClick={() => setGame((g) => step(g))}
          disabled={running || game.status !== "playing"}
        >
          Step
        </button>
        <button
          className={btn}
          onClick={() => {
            setRunning(false);
            setGame(makeGame());
          }}
        >
          Reset
        </button>
        <span className="ml-1 text-sm text-muted">
          tick {game.stats.ticks} · runs every 2s
        </span>
      </div>

      {game.status !== "playing" && (
        <p
          className="mt-3 border-l-4 px-4 py-3 text-sm font-bold"
          style={{
            borderColor: game.status === "won" ? "#639922" : "#E24B4A",
            background: game.status === "won" ? "rgba(151,196,89,0.15)" : "rgba(240,149,149,0.2)",
            color: "#1a1a1a",
          }}
        >
          {game.status === "won"
            ? `Enemy destroyed in ${game.stats.ticks} ticks — ${game.stats.civ} civilian casualties.`
            : "Friendly forces wiped out."}
        </p>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[
          ["Enemy left", enemyLeft],
          ["Friendly left", friendlyLeft],
          ["Enemy killed", game.stats.enemyKilled],
          ["Civilian dead", game.stats.civ],
        ].map(([label, val]) => (
          <div key={label} className="bg-panel px-2 py-2">
            <p className="kicker text-[10px]">{label}</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-ink">{val}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 82px)`,
            gap: 3,
            width: "max-content",
          }}
        >
          {game.cells.map((row, r) =>
            row.map((cell, c) => {
              const units = at(game, r, c);
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    position: "relative",
                    height: 82,
                    background: cell.active ? RATING_TINT[cell.rating] : "#ffffff",
                    border: `2px ${cell.active ? "solid" : "dashed"} ${RATING_COLOR[cell.rating]}`,
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    onClick={() => cycleRating(r, c)}
                    title="rating requirement (cycles G/Y/R)"
                    style={{
                      position: "absolute",
                      top: 2,
                      left: 2,
                      width: 20,
                      height: 16,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      background: RATING_COLOR[cell.rating],
                      border: "none",
                      borderRadius: 2,
                      cursor: "pointer",
                    }}
                  >
                    {RATING_LETTER[cell.rating]}
                  </button>
                  <button
                    onClick={() => toggleActive(r, c)}
                    title="activate / deactivate"
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      height: 16,
                      padding: "0 4px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: cell.active ? "#fff" : "#5c5c5c",
                      background: cell.active ? "#444441" : "#e8e5db",
                      border: "none",
                      borderRadius: 2,
                      cursor: "pointer",
                    }}
                  >
                    {cell.active ? "ON" : "OFF"}
                  </button>
                  <div
                    style={{
                      position: "absolute",
                      left: 3,
                      right: 3,
                      top: 22,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    {units.map((u) => (
                      <Marker key={u.id} u={u} />
                    ))}
                  </div>
                  {cell.civ > 0 && (
                    <span
                      title="civilians present"
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 3,
                        fontSize: 10,
                        color: "#5f5e5a",
                      }}
                    >
                      ⚇ {cell.civ}
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span style={{ width: 13, height: 13, background: "#378ADD", display: "inline-block", borderRadius: 2 }} />
          friendly troops
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 13, height: 13, background: "#378ADD", borderRadius: "50%", border: "2px solid #639922", display: "inline-block", boxSizing: "border-box" }} />
          friendly drone (border = rating)
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 13, height: 13, background: "#C0392B", display: "inline-block", borderRadius: 2 }} />
          enemy troops
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 13, height: 13, background: "#C0392B", borderRadius: "50%", display: "inline-block" }} />
          enemy drone
        </span>
        <span>⚇ = civilians</span>
      </div>
    </div>
  );
}

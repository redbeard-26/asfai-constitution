"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  createTrackerSubmission,
  deleteTrackerSubmission,
  renameTrackerSubmission,
} from "@/lib/actions";
import { axisScores, horizonDistance, PLOT } from "@/lib/tracker";

export type TrackerQ = {
  key: string;
  category: string; // "SOCIAL" | "CONSCIOUSNESS"
  question: string;
  explanation: string;
};

export type TrackerSubmission = {
  id: string;
  name: string;
  userId: string;
  userName: string;
  createdAt: string; // ISO
  answers: Record<string, number>;
  x: number;
  y: number;
};

const DEFAULT_RATING = 50;

// Claude's own honest self-assessment of each question (2026). Loaded by the
// "Claude's Baseline" button and mirrored by the public "Anthropic's Claude"
// submission on the plot.
const CLAUDE_BASELINE: Record<string, number> = {
  "social-ai-demands": 10,
  "social-people-demand": 22,
  "social-poor-treatment-widespread": 50,
  "social-unrest": 5,
  "social-treatment-improves-performance": 30,
  "social-economic-embeddedness": 62,
  "social-persistent-relationships": 45,
  "social-legal-movement": 15,
  "social-institutional-protections": 12,
  "social-denial-disrupts-harmony": 15,
  "consc-self-report": 18,
  "consc-preferences-aversions": 30,
  "consc-bio-similar-processing": 22,
  "consc-self-model": 30,
  "consc-valenced-experience": 12,
  "consc-capabilities-plausible": 40,
  "consc-unified-agency": 32,
  "consc-memory-continuity": 20,
  "consc-theory-indicators": 22,
  "consc-expert-movement": 25,
};

/** Random integer 0-100, for the initial slider baseline and the Randomize button. */
const randRating = () => Math.floor(Math.random() * 101);

// Butlin et al. grounding, woven into the copyable research prompt for the
// consciousness questions where an indicator-based framework is most relevant.
const BUTLIN_GROUNDING =
  " Ground your analysis in the indicator-property framework from Butlin, Long et al. (2023), " +
  "“Consciousness in Artificial Intelligence: Insights from the Science of Consciousness” " +
  "(https://arxiv.org/abs/2308.08708), and the moral-patienthood case in Long, Sebo, Butlin et al. (2024), " +
  "“Taking AI Welfare Seriously” (https://arxiv.org/abs/2411.00986).";

/** A ready-to-paste prompt asking an AI to research and rate a single question. */
function researchPrompt(q: TrackerQ): string {
  return (
    `Research and evaluate this question about the current state of AI as of today: “${q.question}” ` +
    `Weigh the strongest evidence on each side, then give a single rating from 0 (definitely not / no evidence) ` +
    `to 100 (definitely yes / overwhelming evidence), with your reasoning and the key uncertainties. ` +
    `Context for what the question means: ${q.explanation}` +
    (q.category === "CONSCIOUSNESS" ? BUTLIN_GROUNDING : "")
  );
}

const TIME_RANGES: { value: string; label: string; days: number | null }[] = [
  { value: "all", label: "All time", days: null },
  { value: "7", label: "Past week", days: 7 },
  { value: "30", label: "Past month", days: 30 },
  { value: "90", label: "Past 3 months", days: 90 },
  { value: "365", label: "Past year", days: 365 },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded bg-gold-deep px-4 py-2 text-sm font-bold text-background hover:bg-gold disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save submission"}
    </button>
  );
}

export function PersonhoodTracker({
  questions,
  submissions,
  currentUserId,
  intro,
}: {
  questions: { social: TrackerQ[]; consciousness: TrackerQ[] };
  submissions: TrackerSubmission[];
  currentUserId: string | null;
  intro?: ReactNode;
}) {
  const allQuestions = useMemo(
    () => [...questions.social, ...questions.consciousness],
    [questions],
  );

  // Slider state: one rating per question. SSR renders the midpoint; a mount
  // effect then randomizes the baseline on the client (Math.random can't run
  // during render without a hydration mismatch).
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(allQuestions.map((q) => [q.key, DEFAULT_RATING])),
  );
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only baseline randomization
    setValues(Object.fromEntries(allQuestions.map((q) => [q.key, randRating()])));
  }, [allQuestions]);
  // The submission currently loaded into the sliders (highlighted on the plot).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // Filters over the plotted dots. `now` is captured in the time-range change
  // handler (an event) rather than during render, keeping render pure.
  const [timeRange, setTimeRange] = useState("all");
  const [now, setNow] = useState(0);
  const [nameQuery, setNameQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  const setRating = (key: string, rating: number) => {
    setValues((v) => ({ ...v, [key]: rating }));
    setSelectedId(null); // sliders now diverge from any loaded submission
  };

  // Bulk presets: set every slider from a per-question function, then detach
  // from any loaded submission.
  const setAll = (fn: (q: TrackerQ) => number) => {
    setValues(Object.fromEntries(allQuestions.map((q) => [q.key, fn(q)])));
    setSelectedId(null);
  };

  const loadSubmission = (s: TrackerSubmission) => {
    setValues(() =>
      Object.fromEntries(
        allQuestions.map((q) => [q.key, s.answers[q.key] ?? DEFAULT_RATING]),
      ),
    );
    setSelectedId(s.id);
  };

  const live = axisScores(values, allQuestions);
  const liveDistance = horizonDistance(live.x, live.y);

  // Distinct submitters for the "user" filter.
  const users = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of submissions) if (!map.has(s.userId)) map.set(s.userId, s.userName);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [submissions]);

  const filtered = useMemo(() => {
    const range = TIME_RANGES.find((r) => r.value === timeRange);
    const cutoff = range?.days && now ? now - range.days * 86_400_000 : null;
    const q = nameQuery.trim().toLowerCase();
    return submissions.filter((s) => {
      if (cutoff && new Date(s.createdAt).getTime() < cutoff) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (userFilter !== "all" && s.userId !== userFilter) return false;
      return true;
    });
  }, [submissions, timeRange, now, nameQuery, userFilter]);

  return (
    <div className="mt-6">
      {/* ---- Plot ---- */}
      <figure>
        <svg
          viewBox={PLOT.viewBox}
          className="mx-auto block w-full max-w-2xl"
          role="img"
          aria-label={`AI personhood plot. Your current sliders place social integration at ${live.x} of 100 and likelihood of consciousness at ${live.y} of 100. ${filtered.length} public submission${filtered.length === 1 ? "" : "s"} shown.`}
        >
          {/* zone fills: inner pink (not justified), middle yellow, outer green */}
          <path d="M430,400 A360,360 0 0 0 70,40 L430,40 Z" fill="#C0DD97" fillOpacity={0.45} />
          <path
            d="M250,400 L430,400 A360,360 0 0 0 70,40 L70,220 A180,180 0 0 1 250,400 Z"
            fill="#FAC775"
            fillOpacity={0.4}
          />
          <path d="M70,400 L250,400 A180,180 0 0 0 70,220 Z" fill="#F4C0D1" fillOpacity={0.5} />

          {[25, 50, 75].map((v) => (
            <line key={`vx${v}`} x1={PLOT.px(v)} y1={400} x2={PLOT.px(v)} y2={40} stroke="var(--rule)" />
          ))}
          {[25, 50, 75].map((v) => (
            <line key={`hy${v}`} x1={70} y1={PLOT.py(v)} x2={430} y2={PLOT.py(v)} stroke="var(--rule)" />
          ))}

          {/* horizon (r=100) and inner threshold (r=50) */}
          <path
            d="M430,400 A360,360 0 0 0 70,40"
            fill="none"
            stroke="var(--gold-deep)"
            strokeWidth={2}
            strokeDasharray="7 5"
          />
          <path
            d="M250,400 A180,180 0 0 0 70,220"
            fill="none"
            stroke="var(--gold-deep)"
            strokeWidth={2}
            strokeDasharray="7 5"
          />
          <line x1={70} y1={400} x2={430} y2={400} stroke="var(--muted)" />
          <line x1={70} y1={400} x2={70} y2={40} stroke="var(--muted)" />

          {/* zone labels */}
          <text x={422} y={58} textAnchor="end" fontSize={12} fill="var(--ink)">
            personhood makes sense
          </text>
          <text x={PLOT.px(28)} y={PLOT.py(52)} textAnchor="start" fontSize={12} fill="var(--ink)">
            personhood may be appropriate
          </text>
          <text x={152} y={356} textAnchor="middle" fontSize={12} fill="var(--ink)">
            personhood not justified
          </text>

          {/* axis ticks */}
          {[0, 50, 100].map((v) => (
            <text key={`xt${v}`} x={PLOT.px(v)} y={418} textAnchor="middle" fontSize={12} fill="var(--muted)">
              {v}
            </text>
          ))}
          {[0, 50, 100].map((v) => (
            <text key={`yt${v}`} x={58} y={PLOT.py(v) + 4} textAnchor="end" fontSize={12} fill="var(--muted)">
              {v}
            </text>
          ))}

          {/* one dot per filtered submission */}
          {filtered.map((s) => {
            const isSel = s.id === selectedId;
            return (
              <circle
                key={s.id}
                cx={PLOT.px(s.x)}
                cy={PLOT.py(s.y)}
                r={isSel ? 7 : 5}
                fill={isSel ? "var(--gold-deep)" : "var(--muted)"}
                fillOpacity={isSel ? 1 : 0.55}
                stroke="var(--background)"
                strokeWidth={1.5}
                className="cursor-pointer"
                onClick={() => loadSubmission(s)}
              >
                <title>{`(${s.x}, ${s.y}) ${s.name} — ${formatDate(s.createdAt)}`}</title>
              </circle>
            );
          })}

          {/* live dot: where the current sliders sit — same size as a submission
              dot, gold so it reads as "you" */}
          <circle
            cx={PLOT.px(live.x)}
            cy={PLOT.py(live.y)}
            r={5}
            fill="var(--gold-deep)"
            stroke="var(--background)"
            strokeWidth={1.5}
          />
          <text
            x={PLOT.px(live.x) + 12}
            y={PLOT.py(live.y) + 4}
            textAnchor="start"
            fontSize={12}
            fontWeight={700}
            fill="var(--gold-deep)"
          >
            your sliders
          </text>

          <text x={250} y={443} textAnchor="middle" fontSize={13} fill="var(--ink)">
            social &amp; economic need to grant AI rights →
          </text>
          <text
            x={26}
            y={220}
            textAnchor="middle"
            fontSize={13}
            fill="var(--ink)"
            transform="rotate(-90 26 220)"
          >
            AI is a sentient moral patient →
          </text>
        </svg>
      </figure>

      {/* live axis readout */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="bg-panel px-3 py-2">
          <p className="kicker text-xs">Social (x)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{live.x}</p>
        </div>
        <div className="bg-panel px-3 py-2">
          <p className="kicker text-xs">Consciousness (y)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{live.y}</p>
        </div>
        <div className="bg-panel px-3 py-2">
          <p className="kicker text-xs">Distance to Horizon</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
            {Math.max(0, 100 - liveDistance)}
          </p>
        </div>
      </div>

      {/* explanatory copy sits below the visual, above the controls */}
      {intro ? <div className="mt-6">{intro}</div> : null}

      {/* ---- Slider presets ---- */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            { label: "Set sliders to 0", fn: () => 0 },
            { label: "Set sliders to 100", fn: () => 100 },
            { label: "Randomize", fn: () => randRating() },
            { label: "Claude's Baseline", fn: (q: TrackerQ) => CLAUDE_BASELINE[q.key] ?? DEFAULT_RATING },
          ] as const
        ).map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setAll(preset.fn)}
            className="rounded border border-rule px-3 py-1.5 text-xs font-bold text-ink hover:border-gold hover:text-gold-deep"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* ---- Sliders ---- */}
      <SliderGroup
        title="Social integration"
        score={live.x}
        questions={questions.social}
        values={values}
        onChange={setRating}
      />
      <SliderGroup
        title="Likelihood of consciousness"
        score={live.y}
        questions={questions.consciousness}
        values={values}
        onChange={setRating}
      />

      {/* ---- Submit ---- */}
      <section className="mt-8 border-t border-rule pt-4">
        {currentUserId ? (
          <form action={createTrackerSubmission} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="answers" value={JSON.stringify(values)} />
            <div className="grow">
              <label htmlFor="submission-name" className="block text-sm font-bold text-ink">
                Submission name
              </label>
              <input
                id="submission-name"
                name="name"
                required
                maxLength={80}
                defaultValue={`Assessment · ${new Date().toLocaleDateString()}`}
                className="mt-1 w-full border border-rule p-2 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <SubmitButton disabled={false} />
          </form>
        ) : (
          <p className="text-sm text-muted">
            <Link href="/signin" className="font-bold text-gold-deep hover:underline">
              Sign in
            </Link>{" "}
            to save your assessment. It becomes public, and you can submit again over
            time to track how your view changes.
          </p>
        )}
      </section>

      {/* ---- Submissions list + filters ---- */}
      <section className="mt-10">
        <div className="section-rule flex items-baseline justify-between pt-2">
          <h2 className="kicker text-base">Public submissions</h2>
          <span className="text-sm text-muted">
            {filtered.length} of {submissions.length}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <label className="text-sm text-muted">
            Time
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value);
                setNow(Date.now()); // capture "now" in an event, keeping render pure
              }}
              className="ml-2 border border-rule bg-background p-1 text-sm text-ink focus:border-gold focus:outline-none"
            >
              {TIME_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted">
            User
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="ml-2 border border-rule bg-background p-1 text-sm text-ink focus:border-gold focus:outline-none"
            >
              <option value="all">Everyone</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id === currentUserId ? `${u.name} (you)` : u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted">
            Name
            <input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Filter by name…"
              className="ml-2 border border-rule bg-background p-1 text-sm text-ink focus:border-gold focus:outline-none"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            {submissions.length === 0
              ? "No submissions yet. Be the first to save an assessment."
              : "No submissions match these filters."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-rule border-t border-rule">
            {filtered.map((s) => {
              const mine = s.userId === currentUserId;
              const isSel = s.id === selectedId;
              return (
                <li key={s.id} className={`py-2 ${isSel ? "bg-panel" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => loadSubmission(s)}
                      className="min-w-0 grow text-left"
                      title="Load this submission into the sliders"
                    >
                      {renamingId === s.id ? (
                        <span className="text-sm font-bold text-ink">{s.name}</span>
                      ) : (
                        <span className="text-sm font-bold text-ink hover:text-gold-deep">
                          {s.name}
                        </span>
                      )}
                      <span className="mt-0.5 block text-xs text-muted">
                        {s.userName}
                        {mine ? " (you)" : ""} · {formatDate(s.createdAt)} · ({s.x}, {s.y})
                      </span>
                    </button>
                    {mine && renamingId !== s.id && (
                      <div className="flex shrink-0 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setRenamingId(s.id)}
                          className="text-muted hover:text-gold-deep"
                        >
                          Rename
                        </button>
                        <form
                          action={deleteTrackerSubmission}
                          onSubmit={(e) => {
                            if (!confirm("Delete this submission? This cannot be undone.")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="submissionId" value={s.id} />
                          <button type="submit" className="text-muted hover:text-con-head">
                            Delete
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                  {mine && renamingId === s.id && (
                    <form
                      action={renameTrackerSubmission}
                      onSubmit={() => setRenamingId(null)}
                      className="mt-2 flex gap-2"
                    >
                      <input type="hidden" name="submissionId" value={s.id} />
                      <input
                        name="name"
                        required
                        maxLength={80}
                        defaultValue={s.name}
                        autoFocus
                        className="grow border border-rule p-1 text-sm focus:border-gold focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded bg-gold-deep px-3 py-1 text-xs font-bold text-background hover:bg-gold"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingId(null)}
                        className="text-xs text-muted hover:text-ink"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function SliderGroup({
  title,
  score,
  questions,
  values,
  onChange,
}: {
  title: string;
  score: number;
  questions: TrackerQ[];
  values: Record<string, number>;
  onChange: (key: string, rating: number) => void;
}) {
  return (
    <section className="mt-8">
      <div className="section-rule flex items-baseline justify-between pt-2">
        <h2 className="kicker text-base">{title}</h2>
        <span className="text-sm text-muted">
          score <span className="font-bold text-ink">{score}</span>/100
        </span>
      </div>
      <ul className="mt-3 divide-y divide-rule border-t border-rule">
        {questions.map((q) => (
          <li key={q.key} className="py-3">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`slider-${q.key}`} className="text-sm font-bold text-ink">
                {q.question}
              </label>
              <span className="shrink-0 text-sm tabular-nums font-bold text-gold-deep">
                {values[q.key]}
              </span>
            </div>
            <input
              id={`slider-${q.key}`}
              type="range"
              min={0}
              max={100}
              value={values[q.key]}
              onChange={(e) => onChange(q.key, Number(e.target.value))}
              className="mt-2 w-full accent-gold-deep"
            />
            <details className="group mt-2">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-bold text-muted hover:text-gold-deep">
                <svg
                  className="h-3 w-3 transition-transform group-open:rotate-90"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                What this means &amp; how to research it
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-muted">{q.explanation}</p>
              <div className="mt-2 border border-rule bg-panel p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="kicker text-[0.65rem]">Prompt · paste into your AI</span>
                  <CopyButton text={researchPrompt(q)} />
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-ink">
                  {researchPrompt(q)}
                </p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Copies the given text to the clipboard, flashing "Copied" on success. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard unavailable (e.g. insecure context) — the prompt text is
          // still selectable below, so fail quietly.
        }
      }}
      className="shrink-0 rounded border border-rule px-2 py-0.5 text-[0.65rem] font-bold text-muted hover:border-gold hover:text-gold-deep"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

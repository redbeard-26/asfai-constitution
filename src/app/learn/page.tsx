import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import {
  listSubjects,
  searchConcepts,
  getConcept,
  hardPrereqsOf,
  softPrereqsOf,
  unlocksOf,
  hardUnlockCount,
  computeFrontier,
  neighborhood,
  type Topic,
  type Link as GraphLink,
} from "@/lib/taxonomy";
import {
  getMasteredIds,
  getMasteryRows,
  getProgress,
  type MasteryStatus,
} from "@/lib/learning";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { markMastered, markLearning, clearMastery } from "./actions";

export const metadata = {
  title: "Concept Tracker — AI Constitution",
};

/** Build a /learn href from the params that should survive a navigation. */
function href(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `/learn?${s}` : "/learn";
}

function StatusBadge({ status }: { status?: MasteryStatus }) {
  if (status === "MASTERED") {
    return (
      <span className="rounded-full border border-pro px-2 py-0.5 text-xs font-bold text-pro-head">
        Mastered
      </span>
    );
  }
  if (status === "LEARNING") {
    return (
      <span className="rounded-full border border-gold px-2 py-0.5 text-xs font-bold text-gold-deep">
        Learning
      </span>
    );
  }
  return null;
}

function LinkChips({
  links,
  subject,
  mastered,
}: {
  links: GraphLink[];
  subject?: string;
  mastered: ReadonlySet<string>;
}) {
  if (links.length === 0) return <p className="mt-1 text-sm text-muted">None.</p>;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {links.map((l) => (
        <li key={l.id}>
          <Link
            href={href({ subject, concept: l.id })}
            title={l.reason}
            className={`inline-block rounded border px-2 py-1 text-xs hover:border-gold ${
              mastered.has(l.id)
                ? "border-pro bg-pro-bg text-pro-head"
                : "border-rule text-ink"
            }`}
          >
            {mastered.has(l.id) ? "✓ " : ""}
            {l.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Buttons to record mastery — or a sign-in nudge for signed-out visitors. */
function MasteryActions({
  topicId,
  status,
  returnTo,
  signedIn,
}: {
  topicId: string;
  status?: MasteryStatus;
  returnTo: string;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <Link
        href="/signin"
        className="inline-block rounded bg-gold-deep px-3 py-1.5 text-sm text-background hover:bg-gold"
      >
        Sign in to track this
      </Link>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "MASTERED" && (
        <form action={markMastered}>
          <input type="hidden" name="topicId" value={topicId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="rounded bg-pro-head px-3 py-1.5 text-sm text-background hover:bg-pro">
            Mark mastered
          </button>
        </form>
      )}
      {status === undefined && (
        <form action={markLearning}>
          <input type="hidden" name="topicId" value={topicId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="rounded border border-gold px-3 py-1.5 text-sm text-gold-deep hover:bg-panel">
            Start learning
          </button>
        </form>
      )}
      {status !== undefined && (
        <form action={clearMastery}>
          <input type="hidden" name="topicId" value={topicId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="rounded border border-rule px-3 py-1.5 text-sm text-muted hover:bg-panel">
            Reset
          </button>
        </form>
      )}
    </div>
  );
}

function ConceptDetail({
  topic,
  subject,
  status,
  mastered,
  returnTo,
  backHref,
  signedIn,
}: {
  topic: Topic;
  subject?: string;
  status?: MasteryStatus;
  mastered: ReadonlySet<string>;
  returnTo: string;
  backHref: string;
  signedIn: boolean;
}) {
  const hard = hardPrereqsOf(topic.id);
  const soft = softPrereqsOf(topic.id);
  const unlocks = unlocksOf(topic.id);
  const prompt = topic.assessmentPrompt.replace(/\{\{name\}\}/g, topic.name);

  return (
    <article className="mt-6 border border-rule bg-background p-5">
      <Link href={backHref} className="text-xs text-muted hover:text-ink">
        ← Back
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-ink">{topic.name}</h2>
        <StatusBadge status={status} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {[topic.subject, topic.domain, topic.type.toLowerCase()].join(" · ")}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-ink">{topic.description}</p>

      <div className="mt-4">
        <MasteryActions
          topicId={topic.id}
          status={status}
          returnTo={returnTo}
          signedIn={signedIn}
        />
      </div>

      {topic.evidence.length > 0 && (
        <section className="mt-5">
          <h3 className="kicker text-sm">What mastery looks like</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-ink">
            {topic.evidence.map((e, i) => (
              <li key={i} className="mt-0.5">
                {e}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5 rounded bg-panel p-3">
        <h3 className="kicker text-sm">Check your understanding</h3>
        <p className="mt-1 text-sm italic text-ink">{prompt}</p>
      </section>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <section>
          <h3 className="kicker text-sm">Prerequisites</h3>
          {hard.length > 0 && (
            <>
              <p className="mt-1 text-xs text-muted">Required first</p>
              <LinkChips links={hard} subject={subject} mastered={mastered} />
            </>
          )}
          {soft.length > 0 && (
            <>
              <p className="mt-2 text-xs text-muted">Helpful</p>
              <LinkChips links={soft} subject={subject} mastered={mastered} />
            </>
          )}
          {hard.length === 0 && soft.length === 0 && (
            <p className="mt-1 text-sm text-muted">
              None — this is a foundational concept.
            </p>
          )}
        </section>
        <section>
          <h3 className="kicker text-sm">
            Unlocks{" "}
            <span className="font-normal text-muted">
              ({hardUnlockCount(topic.id)} directly)
            </span>
          </h3>
          <LinkChips links={unlocks} subject={subject} mastered={mastered} />
        </section>
      </div>
    </article>
  );
}

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; q?: string; concept?: string }>;
}) {
  const { subject: rawSubject, q: rawQ, concept } = await searchParams;
  const query = rawQ?.trim() ?? "";
  const user = await getSessionUser();
  const signedIn = Boolean(user);

  const subjects = listSubjects();
  const subject =
    rawSubject && subjects.some((s) => s.subject === rawSubject) ? rawSubject : undefined;

  // Learner state (empty for signed-out visitors — they still get a read-only tour).
  const mastered = user ? await getMasteredIds(user.id) : new Set<string>();
  const statusById = new Map<string, MasteryStatus>();
  if (user) {
    for (const r of await getMasteryRows(user.id)) {
      statusById.set(r.topicId, r.status as MasteryStatus);
    }
  }
  const progress = user ? await getProgress(user.id) : null;

  const selected = concept ? getConcept(concept) : undefined;
  const here = href({ subject, q: query || undefined, concept });
  const backHref = href({ subject, q: query || undefined });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Resources · Learning tool</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Concept Tracker</h1>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        A prerequisite knowledge graph of {progress?.totalTopics ?? 1590} learning
        concepts across {subjects.length} subjects. Track what you&apos;ve mastered and
        see exactly what you&apos;re ready to learn next — the topics whose prerequisites
        you&apos;ve already met. Built on the{" "}
        <a
          href="https://github.com/withmarbleapp/os-taxonomy"
          className="text-gold-deep hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Marble Open Skill Taxonomy
        </a>
        .
      </p>

      {/* Progress / sign-in */}
      {progress ? (
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="bg-panel px-3 py-2">
            <p className="kicker text-xs">Mastered</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-pro-head">
              {progress.masteredCount}
            </p>
          </div>
          <div className="bg-panel px-3 py-2">
            <p className="kicker text-xs">Learning</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-gold-deep">
              {progress.learningCount}
            </p>
          </div>
          <div className="bg-panel px-3 py-2">
            <p className="kicker text-xs">Of total</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
              {progress.totalTopics}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded border border-rule bg-panel px-4 py-3 text-sm text-muted">
          <Link href="/signin" className="font-bold text-gold-deep hover:underline">
            Sign in
          </Link>{" "}
          to track your progress and get personalized recommendations. You can browse
          freely below.
        </p>
      )}

      {progress && progress.bySubject.length > 0 && (
        <div className="mt-4 space-y-2">
          {progress.bySubject.map((s) => {
            const pct = Math.round((s.mastered / s.totalTopics) * 100);
            return (
              <div key={s.subject}>
                <div className="flex items-baseline justify-between text-xs">
                  <Link
                    href={href({ subject: s.subject })}
                    className="font-bold text-ink hover:text-gold-deep"
                  >
                    {s.subject}
                  </Link>
                  <span className="tabular-nums text-muted">
                    {s.mastered}/{s.totalTopics} mastered
                    {s.learning > 0 ? ` · ${s.learning} learning` : ""}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 w-full bg-panel">
                  <div className="h-1.5 bg-pro-rule" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subject filter */}
      <nav className="mt-8 flex flex-wrap gap-2">
        <Link
          href={href({})}
          className={`rounded-full border px-3 py-1 text-xs ${
            subject ? "border-rule text-muted hover:bg-panel" : "border-gold-deep bg-panel text-gold-deep"
          }`}
        >
          All subjects
        </Link>
        {subjects.map((s) => (
          <Link
            key={s.subject}
            href={href({ subject: s.subject })}
            className={`rounded-full border px-3 py-1 text-xs ${
              subject === s.subject
                ? "border-gold-deep bg-panel text-gold-deep"
                : "border-rule text-muted hover:bg-panel"
            }`}
          >
            {s.subject}
            <span className="ml-1 tabular-nums opacity-70">{s.topicCount}</span>
          </Link>
        ))}
      </nav>

      {/* Search */}
      <form method="get" className="mt-4 flex gap-2">
        {subject && <input type="hidden" name="subject" value={subject} />}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={`Search concepts${subject ? ` in ${subject}` : ""}…`}
          className="w-full border border-rule bg-background p-2 text-sm focus:border-gold focus:outline-none"
        />
        <button className="rounded bg-gold-deep px-4 py-2 text-sm text-background hover:bg-gold">
          Search
        </button>
        {query && (
          <Link
            href={href({ subject })}
            className="rounded border border-rule px-4 py-2 text-sm hover:bg-panel"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Main content: concept detail > search results > recommended frontier */}
      {selected ? (
        <ConceptDetail
          topic={selected}
          subject={subject}
          status={statusById.get(selected.id)}
          mastered={mastered}
          returnTo={here}
          backHref={backHref}
          signedIn={signedIn}
        />
      ) : query ? (
        (() => {
          const hits = searchConcepts(query, { subject, limit: 25 });
          return (
            <section className="mt-6">
              <p className="text-xs text-muted">
                {hits.length} {hits.length === 1 ? "match" : "matches"} for “{query}”
              </p>
              {hits.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No concepts match your search.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {hits.map((t) => (
                    <li key={t.id} className="border border-rule bg-background p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={href({ subject, concept: t.id })}
                          className="font-bold text-ink hover:text-gold-deep"
                        >
                          {t.name}
                        </Link>
                        <StatusBadge status={statusById.get(t.id)} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {t.subject} · {t.domain}
                      </p>
                      <p className="mt-1 text-sm text-ink">{t.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })()
      ) : (
        (() => {
          const frontier = computeFrontier(mastered, { subject, limit: 12 });
          return (
            <section className="mt-8">
              <div className="section-rule flex items-baseline justify-between pt-2">
                <h2 className="kicker text-base">
                  {signedIn ? "Ready to learn next" : "Start here"}
                </h2>
                <span className="text-xs text-muted">
                  {subject ? subject : "all subjects"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {signedIn
                  ? "Concepts whose required prerequisites you've already mastered — ranked by how foundational they are."
                  : "Foundational concepts with no prerequisites — the natural entry points into the graph."}
              </p>
              {frontier.length === 0 ? (
                <p className="mt-4 text-sm text-muted">
                  No frontier here — you may have mastered everything in scope. 🎉
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {frontier.map((f) => (
                    <li
                      key={f.topic.id}
                      className="flex items-start justify-between gap-3 border border-rule bg-background p-3"
                    >
                      <div className="min-w-0">
                        <Link
                          href={href({ subject, concept: f.topic.id })}
                          className="font-bold text-ink hover:text-gold-deep"
                        >
                          {f.topic.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">
                          {f.topic.subject} · {f.topic.domain}
                          {f.unlockCount > 0
                            ? ` · unlocks ${f.unlockCount} ${f.unlockCount === 1 ? "concept" : "concepts"}`
                            : ""}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-ink">
                          {f.topic.description}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <MasteryActions
                          topicId={f.topic.id}
                          status={statusById.get(f.topic.id)}
                          returnTo={here}
                          signedIn={signedIn}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })()
      )}

      {/* Knowledge-graph map (subject-scoped so it stays legible) */}
      <section className="mt-10">
        <div className="section-rule flex items-baseline justify-between pt-2">
          <h2 className="kicker text-base">Knowledge-graph map</h2>
          {subject && <span className="text-xs text-muted">{subject}</span>}
        </div>
        {subject ? (
          <>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-pro-rule" /> Mastered
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-gold" /> Ready to learn
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm border border-panel-border bg-panel" />{" "}
                Locked
              </span>
              <span className="ml-auto">Hover a node for its description · click to open</span>
            </div>
            <div className="mt-3 overflow-x-auto border border-rule bg-background p-2">
              <KnowledgeGraph
                hood={neighborhood(mastered, { subject })}
                hrefFor={(id) => href({ subject, concept: id })}
              />
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Pick a subject above to see its knowledge-graph map.
          </p>
        )}
      </section>
    </div>
  );
}

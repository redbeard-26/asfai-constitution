import Link from "next/link";

const TOPICS = [
  {
    slug: "ai-values",
    title: "AI Values",
    desc: "What ethical principles should form the basis of AI training, and how are they prioritized?",
  },
  {
    slug: "human-rights",
    title: "Human Rights",
    desc: "What rights do humans have with respect to AI systems and their operators?",
  },
  {
    slug: "ai-personhood",
    title: "AI Rights",
    desc: "What rights, if any, do AI systems have with respect to humans?",
  },
  {
    slug: "limitations",
    title: "Limitations",
    desc: "What limits should never be crossed — and where is international cooperation needed to enforce them?",
  },
];

const PILLARS: [string, string][] = [
  [
    "Collaborative",
    "shaped by contributions from many organizations and individuals, not authored by any single voice.",
  ],
  ["Focused", "centered on AI governance specifically."],
  [
    "Diverse",
    "inclusive of perspectives from all sectors, backgrounds, and geographies, across the world.",
  ],
  [
    "Dynamic",
    "built to persist for generations, adapting as the AI landscape changes.",
  ],
];

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">About</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          About the AI Constitution
        </h1>
      </div>

      <section className="mt-6 space-y-4">
        <p className="leading-relaxed text-ink">
          Artificial intelligence is reshaping society faster than our frameworks
          for governance, accountability, and ethics can keep up. The AI
          Constitution is a collaborative, community-driven effort to close that
          gap — bringing together organizations, experts, and voices from across
          sectors and borders to shape a shared framework for the development and
          governance of AI.
        </p>
        <p className="leading-relaxed text-ink">
          What makes this effort different is who shapes it. It is not a document
          authored by one organization imposing its vision, but a living
          framework — open and evolving — built on the premise that getting AI
          governance right takes many disciplines working toward shared
          principles.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="kicker text-base">What is the AI Constitution?</h2>
        <p className="mt-2 leading-relaxed text-ink">
          Rather than one organization&apos;s vision, it is designed to reflect
          the perspectives of policymakers, technologists, researchers, legal
          experts, ethicists, business leaders, and civil society. The goal is a
          living, working document that can meaningfully inform policy and guide
          the responsible development of safe and beneficial AI. It is meant to
          be:
        </p>
        <ul className="mt-3 space-y-2">
          {PILLARS.map(([k, v]) => (
            <li key={k} className="border-l-4 border-gold bg-panel px-4 py-2 text-sm text-ink">
              <strong>{k}</strong> — {v}
            </li>
          ))}
        </ul>
        <p className="mt-3 inline-block rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This site hosts an open, community-developed draft. It reflects topics
          for discussion, not the official position of ASFAI.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="kicker text-base">Why is it needed?</h2>
        <p className="leading-relaxed text-ink">
          We are at a pivotal moment. AI capabilities are advancing rapidly — and
          with them, the potential to transform how societies function, how
          decisions are made, and how power is distributed. Unlike previous
          transformational technologies, AI can act autonomously, making
          consequential decisions at a scale and speed that outpaces existing
          governance structures.
        </p>
        <p className="leading-relaxed text-ink">
          The challenge is not just technical — it is political, ethical, and
          deeply human. No single organization, government, or discipline has all
          the answers. Many organizations have published AI principles; this
          effort is different in seeking a genuinely broad set of constituencies
          and a living document — with real mechanisms for achieving its stated
          goals, and international cooperation where enforcement demands it. Not a
          declaration, but a foundation.
        </p>
      </section>

      <section className="mt-8">
        <div className="section-rule pt-3">
          <h2 className="kicker text-base">What it covers</h2>
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {TOPICS.map((t) => (
            <li
              key={t.slug}
              className="border border-panel-border border-l-4 border-l-gold bg-panel p-5"
            >
              <Link href={`/p/${t.slug}`} className="block">
                <h3 className="text-xl font-bold text-ink hover:text-gold-deep">
                  {t.title}
                </h3>
              </Link>
              <p className="mt-2 text-sm text-ink">{t.desc}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Read the full draft under{" "}
          <Link href="/articles" className="text-gold-deep hover:underline">
            Articles
          </Link>
          , or browse every thesis under{" "}
          <Link href="/theses" className="text-gold-deep hover:underline">
            Theses
          </Link>
          . The constitution&apos;s own structure and governing institution are
          taken up separately in Article I.
        </p>
      </section>

      <section className="mt-10">
        <div className="section-rule pt-3">
          <h2 className="kicker text-base">What is ASFAI?</h2>
        </div>
        <p className="mt-3 leading-relaxed text-ink">
          The AI Constitution is hosted by the American Society for AI (ASFAI), a
          philanthropic organization dedicated to creating a better world with AI.
          ASFAI brings together leaders from across industries and disciplines —
          pioneers in AI, entrepreneurs, technologists, philanthropists, authors,
          investors, lawyers, policymakers, researchers, computer scientists,
          engineers, doctors, and professors — making it a natural convener for an
          initiative that depends on the breadth and diversity of its
          contributors.
        </p>
      </section>
    </div>
  );
}

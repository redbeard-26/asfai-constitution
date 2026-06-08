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

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">About</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          About the AI Constitution
        </h1>
      </div>

      <section className="mt-6">
        <h2 className="kicker text-base">What is ASFAI?</h2>
        <p className="mt-2 leading-relaxed text-ink">
          The American Society for AI (ASFAI) is a philanthropic organization
          dedicated to creating a better world with AI. Its members include
          leaders from diverse backgrounds and industries — pioneers in AI,
          entrepreneurs, technologists, philanthropists, authors, investors,
          lawyers, policymakers, researchers, computer scientists, engineers,
          doctors, and professors.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="kicker text-base">What is the AI Constitution?</h2>
        <p className="mt-2 leading-relaxed text-ink">
          The AI Constitution is an effort to bring together key constituencies
          to articulate shared values and help guide the development of safe and
          beneficial AI. It is meant to be:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            ["Focused", "centered on AI governance specifically."],
            ["Diverse", "including member organizations of all types, across the world."],
            ["Dynamic", "persisting for generations, while adapting to the changing AI landscape."],
          ].map(([k, v]) => (
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

      <section className="mt-8">
        <h2 className="kicker text-base">Why is it needed?</h2>
        <p className="mt-2 leading-relaxed text-ink">
          We are at the cusp of a new era. AI capabilities are developing rapidly
          and could transform civilization and humanity. Unlike previous
          transformational technologies, AI can make autonomous decisions based on
          its own value systems. We need to agree on principles so we can mitigate
          the risks and maximize the benefits of that transformation. Many
          organizations have published AI principles before; this effort is
          different in seeking a diverse set of constituencies and a living
          document — with mechanisms for actually achieving its stated goals.
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
          . The broader effort also considers the constitution&apos;s own
          structure and governing institution; that work is out of scope for this
          site for now.
        </p>
      </section>
    </div>
  );
}

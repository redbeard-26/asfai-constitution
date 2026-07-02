import { getPersonhoodTracker } from "@/lib/data";

export const metadata = {
  title: "Personhood Tracker — AI Constitution",
};

type Q = { key: string; question: string; rating: number; explanation: string };

function QuestionList({ questions }: { questions: Q[] }) {
  return (
    <ul className="mt-3 divide-y divide-rule border-t border-rule">
      {questions.map((q) => (
        <li key={q.key} className="py-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-bold text-ink">{q.question}</span>
            <span className="shrink-0 text-sm tabular-nums text-gold-deep">
              {q.rating}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-panel">
            <div className="h-1.5 bg-gold-deep" style={{ width: `${q.rating}%` }} />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">{q.explanation}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function PersonhoodTrackerPage() {
  const { social, consciousness, x, y } = await getPersonhoodTracker();

  // Plot geometry (data 0-100 → SVG px). Origin bottom-left, square scale.
  const px = (v: number) => 70 + v * 3.6;
  const py = (v: number) => 400 - v * 3.6;
  const cx = px(x);
  const cy = py(y);
  const distance = Math.round(Math.sqrt(x * x + y * y));
  const beyond = distance >= 100;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Article V · AI Personhood</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Personhood Tracker
        </h1>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        A living estimate of where AI stands on two axes: how far it is socially
        and economically integrated (x), and how likely it is to be a sentient
        moral patient (y).
      </p>

      <figure className="mt-6">
        <svg
          viewBox="0 0 500 470"
          className="mx-auto block w-full max-w-2xl"
          role="img"
          aria-label={`AI personhood plot. Social integration ${x} of 100 on the x-axis, likelihood of consciousness ${y} of 100 on the y-axis. The point sits ${beyond ? "beyond" : "inside"} the personhood horizon.`}
        >
          {/* zone fills: inner pink (not justified), middle yellow (may be
              appropriate), outer green (makes sense) */}
          <path
            d="M430,400 A360,360 0 0 0 70,40 L430,40 Z"
            fill="#C0DD97"
            fillOpacity={0.45}
          />
          <path
            d="M250,400 L430,400 A360,360 0 0 0 70,40 L70,220 A180,180 0 0 1 250,400 Z"
            fill="#FAC775"
            fillOpacity={0.4}
          />
          <path
            d="M70,400 L250,400 A180,180 0 0 0 70,220 Z"
            fill="#F4C0D1"
            fillOpacity={0.5}
          />
          {[25, 50, 75].map((v) => (
            <line
              key={`vx${v}`}
              x1={px(v)}
              y1={400}
              x2={px(v)}
              y2={40}
              stroke="var(--rule)"
            />
          ))}
          {[25, 50, 75].map((v) => (
            <line
              key={`hy${v}`}
              x1={70}
              y1={py(v)}
              x2={430}
              y2={py(v)}
              stroke="var(--rule)"
            />
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
          <text x={px(28)} y={py(52)} textAnchor="start" fontSize={12} fill="var(--ink)">
            personhood may be appropriate
          </text>
          <text x={152} y={356} textAnchor="middle" fontSize={12} fill="var(--ink)">
            personhood not justified
          </text>

          {/* axis ticks */}
          {[0, 50, 100].map((v) => (
            <text
              key={`xt${v}`}
              x={px(v)}
              y={418}
              textAnchor="middle"
              fontSize={12}
              fill="var(--muted)"
            >
              {v}
            </text>
          ))}
          {[0, 50, 100].map((v) => (
            <text
              key={`yt${v}`}
              x={58}
              y={py(v) + 4}
              textAnchor="end"
              fontSize={12}
              fill="var(--muted)"
            >
              {v}
            </text>
          ))}

          {/* current point */}
          <circle
            cx={cx}
            cy={cy}
            r={7}
            fill="var(--gold-deep)"
            stroke="var(--background)"
            strokeWidth={2}
          />
          <text x={cx - 14} y={cy + 4} textAnchor="end" fontSize={13} fill="var(--ink)">
            today
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

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="bg-panel px-3 py-2">
          <p className="kicker text-xs">Social (x)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{x}</p>
        </div>
        <div className="bg-panel px-3 py-2">
          <p className="kicker text-xs">Consciousness (y)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{y}</p>
        </div>
        <div className="bg-panel px-3 py-2">
          <p className="kicker text-xs">Distance to Horizon</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
            {Math.max(0, 100 - distance)}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <div className="section-rule flex items-baseline justify-between pt-2">
          <h2 className="kicker text-base">Social integration</h2>
          <span className="text-sm text-muted">
            score <span className="font-bold text-ink">{x}</span>/100
          </span>
        </div>
        <QuestionList questions={social} />
      </section>

      <section className="mt-8">
        <div className="section-rule flex items-baseline justify-between pt-2">
          <h2 className="kicker text-base">Likelihood of consciousness</h2>
          <span className="text-sm text-muted">
            score <span className="font-bold text-ink">{y}</span>/100
          </span>
        </div>
        <QuestionList questions={consciousness} />
      </section>
    </div>
  );
}

import { Markdown } from "@/components/Markdown";

export const metadata = {
  title: "Autonomous Targeting — AI Constitution",
};

const PRINCIPLES: { id: string; lead: string; rest: string }[] = [
  {
    id: "P1",
    lead: "Human targeting control is not a universally viable principle.",
    rest: 'Against jamming, GPS-denial, saturation, and short-warning threats, requiring a human to approve each engagement is sometimes operationally impossible — and nominal "on-the-loop" supervision (the 20-second rubber stamp) is not a real safeguard, so pretending it satisfies the requirement is worse than admitting it doesn\'t.',
  },
  {
    id: "P2",
    lead: "Autonomous targeting authority should be granted as a bounded pre-authorization, limited in time and space.",
    rest: 'The human judgment is discharged once, over a defined cell and window ("engage predicate P in box X during T1–T2"), not re-exercised at each trigger.',
  },
  {
    id: "P3",
    lead: "Autonomous targeting eligibility is a two-variable function.",
    rest: "Authorization requires the system's certified accuracy rating to meet or exceed the threshold set by the box's risk level. Higher-risk boxes demand higher-rated systems — or, equivalently, a tighter envelope or a human returned to the loop.",
  },
  {
    id: "P4",
    lead: "The battlefield commander is the accountable authority for all box designations.",
    rest: "Responsibility attaches to the commander who defines, risk-classifies, and activates every box. Clearing the accuracy threshold makes a system eligible for a box, but it never relieves the commander of accountability.",
  },
  {
    id: "P5",
    lead: "The human-in-the-loop requirement relocates to box designation, not individual targeting decisions.",
    rest: "AI may assist in designating boxes but a human must remain in the loop for that designation. The loop is preserved where judgment is actually exercised (defining the envelope) and released where it isn't viable (the individual engagement within it).",
  },
];

const STORY = `# Twenty-Four Hours in Sector 88–95

## T+0

The brigade holds the western half of the sector. The FLOT runs north to south along the seam between grid columns 91 and 92. Two battalions sit in 90AG and 90AH, positioned opposite the northern portion of the line where the brigade will attack. A third battalion holds in 90AI as the reserve. On the enemy side, a mechanized company screens in 92AG, another unit is dug in to the south in 93AK, and an artillery battery occupies 95AI. A village straddles cells 93AH, 93AI, 94AH, and 94AI. It is still inhabited, and an enemy garrison is quartered in its northeastern buildings.

The electromagnetic environment rules out remote operator control of individual engagements. GPS is denied, datalinks survive only in short bursts, and enemy drones arrive with under thirty seconds of warning. An operator catching a few seconds of feed cannot meaningfully review a target, so the brigade does not build its scheme of fires on that assumption.

Instead, the commander partitions the sector into boxes on the reference grid and assigns each a risk level based on what is inside it. The band of cells along the FLOT, columns 91 and 92 plus 93AG, 93AJ, and 93AK, contains no civilians and no friendly troops beyond the line. These are designated level 1, shown green, and activated. The box over the enemy battery in 95AI is level 2, shown amber. The cells of the village are level 3, shown red: civilians are present, so only a system certified to the highest threshold may operate there, and 94AH — the cell holding the confirmed garrison — is activated at level 3. The cells holding the brigade's own battalions in column 90 are also rated red and kept inactive.

Four autonomous drones launch from friendly territory west of the line. Each is blue on the map with a colored border showing its certified accuracy rating, and eligibility is a two-variable function: a system may enter a box only if its rating meets or exceeds the box's risk level. Two drones are rated for level 1 (green border) and will work the green band; they may never leave green cells. One is rated for level 2 (amber border) and is assigned to the battery box. One is certified to the level 3 threshold (red border) — the only system eligible for the activated village cell, which is why that cell can be worked autonomously rather than requiring a human on every shot. The authorization is written once, over defined ground and a defined window — engage armed military vehicles and crew-served weapon positions inside these boxes from T+0 to T+12 — so the judgment is exercised when the boxes are drawn, not at each trigger.

Clearing a threshold makes a system eligible for a box; it never relieves the commander. The staff planning system proposed the initial box layout from the intelligence picture, but the commander reviewed each designation and signed the overlay. Every boundary, rating, activation, and expiry on the map carries that signature.

## T+24h

The attack goes in on the northern axis. The two battalions advance one grid column east into 91AG and 91AH, and the FLOT bends eastward until it cuts through the western half of the village, cells 93AH and 93AI. The enemy screening company falls back into 93AG, the artillery battery displaces north from 95AI to 95AH, and the garrison withdraws into the eastern half of the village.

As the line moves, the drones advance from their staging area into their assigned boxes. The active green band shifts east — column 92 stays hot, and column 93 outside the village goes fully green under a fresh authorization — and the two level-1 drones move their orbits east with it, remaining inside green cells because their rating entitles them to no other ground. The level-2 drone follows the amber box as it displaces from 95AI to 95AH, staying on the battery. The two western village cells, now on the FLOT itself, are activated at level 3; the level-3 drone moves into 93AH and works it autonomously, the only system whose certification admits it there. Certain eastern village cells, where the enemy now shelters among residents, may remain inactive despite pressure to reopen them.

Each boundary is a decision with an author, a rating, a timestamp, and an expiry. If an engagement inside an active box turns out to be wrong, the questions are concrete: whether the cell was correctly classified when the box was drawn, whether the authorization's terms were respected, and whether the system's certification was honestly earned. Certification makes a system eligible for a box. Accountability for the box existing stays with the commander who signed it.`;

export default function AutonomousTargetingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Article IV · Limitations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Autonomous Targeting
        </h1>
      </div>

      <section className="mt-8">
        <div className="section-rule pt-2">
          <h2 className="kicker text-base">Principles</h2>
        </div>
        <ol className="mt-4 space-y-3">
          {PRINCIPLES.map((p) => (
            <li key={p.id} className="border-l-4 border-gold bg-panel px-4 py-3">
              <p className="text-sm leading-relaxed text-ink">
                <span className="font-bold">
                  {p.id} — {p.lead}
                </span>{" "}
                {p.rest}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <div className="section-rule pt-2">
          <h2 className="kicker text-base">The autonomy zone map</h2>
        </div>
        <figure className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/autonomy-zone-map.svg"
            alt="Animated autonomy zone map of sector 88–95, cycling between T+0 and T+24h. Grid cells are rated green (level 1), amber (level 2), or red (level 3); filled cells are active. Autonomous drones are blue with a border showing their certified level: green-rated drones stay in active green cells, a yellow-rated drone works the amber box, and a red-rated drone operates in an active red cell within the village as the front advances east."
            className="mx-auto block w-full max-w-2xl"
          />
        </figure>
      </section>

      <section className="mt-10">
        <div className="section-rule pt-2">
          <h2 className="kicker text-base">The scenario</h2>
        </div>
        <div className="mt-4">
          <Markdown content={STORY} />
        </div>
      </section>
    </div>
  );
}

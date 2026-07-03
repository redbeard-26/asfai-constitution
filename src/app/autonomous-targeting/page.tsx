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

*An explanation of the action depicted in \`autonomy_zone_map_animated.svg\`. Grid references such as 92AH correspond to cells on the map, which cycles between T+0 and T+24h.*

## T+0

The brigade holds the western half of the sector. The FLOT runs north to south along the seam between grid columns 91 and 92. Two battalions sit in 90AG and 90AH, positioned opposite the northern portion of the line where the brigade will attack. A third battalion holds in 90AI as the reserve. On the enemy side, a mechanized company screens in 92AG, another unit is dug in to the south in 93AK, and an artillery battery occupies 95AI. A village straddles cells 93AH, 93AI, 94AH, and 94AI. It is still inhabited, and an enemy garrison is quartered in its northeastern buildings.

The electromagnetic environment rules out remote operator control of individual engagements. GPS is denied, datalinks survive only in short bursts, and enemy drones arrive with under thirty seconds of warning. An operator catching a few seconds of feed cannot meaningfully review a target, so the brigade does not build its scheme of fires on that assumption.

Instead, the commander partitions the sector into boxes on the reference grid and assigns each a risk level based on what is inside it. The band of cells along the FLOT, columns 91 and 92 plus 93AG, 93AJ, and 93AK, contains no civilians and no friendly troops beyond the line. These are designated level 1, shown green, and activated. Four autonomous drones are released into them under a single written authorization: engage armed military vehicles and crew served weapon positions inside these boxes from T+0 to T+12. The judgment is exercised once, over defined ground and a defined window, when the boxes are drawn.

Which systems may operate in which boxes is determined by certification. The drones carry an accuracy rating sufficient only for level 1 cells. The box over the enemy battery in 95AI is level 2, shown amber, and is open only to precision systems certified to that higher threshold. The village is level 3, shown red, in every cell it touches. Civilians are present, so no autonomous system qualifies, and any strike there requires direct human control. Only 94AH, the cell holding the confirmed garrison, is activated at T+0, and everything fired into it is human directed. The other village cells stay inactive. The cells containing the brigade's own battalions in column 90 are also rated red and kept inactive.

The staff planning system proposed the initial box layout from the intelligence picture, but the commander reviewed each designation and signed the overlay. Every boundary, rating, activation, and expiry on the map carries that signature.

## T+24h

The attack goes in on the northern axis. The two battalions advance one grid column east into 91AG and 91AH, and the FLOT bends eastward until it cuts through the western half of the village, cells 93AH and 93AI. The enemy screening company falls back into 93AG, the artillery battery displaces north from 95AI to 95AH, and the garrison withdraws into the eastern half of the village.

The overlay is then redesignated. Cells 91AG and 91AH deactivate as friendly infantry occupies them. The active green band shifts east with the line: column 92 stays hot, and column 93 outside the village goes fully green and active under a fresh authorization. The four drones move their orbits east accordingly, remaining inside level 1 cells because their rating does not entitle them to any other ground. The amber box follows its target from 95AI to 95AH. The two western village cells, now containing the FLOT itself, are activated at level 3, so fires go in but every engagement there is directed — by a human. Certain eastern village cells, where the enemy now shelters among residents, may remain inactive despite pressure to reopen them.

Each boundary is a decision with an author, a rating, a timestamp, and an expiry. If an engagement inside an active green box turns out to be wrong, the questions are concrete: whether the cell was correctly classified when the box was drawn, whether the authorization's terms were respected, and whether the system's certification was honestly earned. Certification makes a system eligible for a box. Accountability for the box existing stays with the commander who signed it.`;

export default function AutonomousTargetingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Article IV · Limitations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Autonomous Targeting
        </h1>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        A working model for how autonomous targeting can be governed without
        pretending a human reviews every shot: bounded, time- and space-limited
        pre-authorizations, gated by certified accuracy, with accountability
        fixed to the commander who draws the boxes.
      </p>

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
            alt="Animated autonomy zone map of sector 88–95, cycling between T+0 and T+24h. Grid cells are rated green (level 1), amber (level 2), or red (level 3); filled cells are active. Four autonomous drones operate in green cells around the front line as it advances east through a village."
            className="mx-auto block w-full max-w-2xl"
          />
          <figcaption className="mt-2 text-center text-xs text-muted">
            The overlay cycles between T+0 and T+24h.
          </figcaption>
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

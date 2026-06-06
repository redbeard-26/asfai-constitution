// Reference documents seeded into the library, with the thesis/article slugs
// each one informs.

export type SeedDocument = {
  slug: string;
  title: string;
  kind: string;
  source?: string;
  eventDate?: string; // ISO date
  summary: string;
  body?: string; // markdown
  fileUrl?: string;
  /** pages (articles/theses) this resource informs, with relevance 0-1 and stance */
  links: {
    slug: string;
    relevance: number;
    stance?: "SUPPORTS" | "OPPOSES" | "NEUTRAL";
  }[];
};

export const SEED_DOCUMENTS: SeedDocument[] = [
  {
    slug: "ai-values-panel-2026-05",
    title: "Panel Report: Navigating the Tensions in AI Governance",
    kind: "Panel Report",
    eventDate: "2026-05-28",
    summary:
      "AI Constitution Subcommittee on AI Values. A virtual panel examined three working theses — argued point and counterpoint — and sought a “zone of agreement” for each. Prepared under the Chatham House Rule; all views de-identified.",
    links: [
      { slug: "constitution", relevance: 0.6 },
      { slug: "ai-values", relevance: 0.7 },
      { slug: "ai-values-csam", relevance: 0.9 },
      { slug: "ai-values-cbrn", relevance: 0.9 },
      { slug: "ai-values-no-harm", relevance: 0.7 },
      { slug: "ai-values-obey-the-law", relevance: 0.6 },
      { slug: "ai-values-helpful-to-users", relevance: 0.8 },
      { slug: "ai-values-helpful-to-humanity", relevance: 0.8 },
      { slug: "human-rights-safety", relevance: 0.4 },
      { slug: "limitations", relevance: 0.6 },
      { slug: "limitations-non-proliferation", relevance: 0.5 },
      { slug: "limitations-termination", relevance: 0.85 },
      { slug: "limitations-autonomous-warfare", relevance: 0.9 },
      { slug: "limitations-law-of-war", relevance: 0.85 },
      { slug: "limitations-human-responsibility", relevance: 0.8 },
    ],
    body: `_AI Constitution Subcommittee on AI Values · Panel held May 28, 2026 · Prepared under the Chatham House Rule (contributions are not attributed to named individuals)._

This panel was convened as a virtual exercise to test the subcommittee's approach to drafting articles of a proposed AI constitution intended for broad, potentially international, adoption. For each of three topics, the panel examined a working thesis, argued point and counterpoint, and sought a "zone of agreement" that could anchor a future constitutional provision. This report records the substance of the discussion only; all views are de-identified.

## Issue 1 — Hard Prohibitions vs. Distributor Responsibility

**Question.** Should AI be trained with hard, training-level prohibitions on the production of universally recognized harms (e.g., CSAM; chemical, biological, or nuclear weapons), or should the legal burden fall on the distributors of the technology to ensure responsible use within their domain?

**Working thesis.** A global safety baseline could be agreed for universally recognized harms (such as CSAM or weapons of mass destruction) while preserving jurisdictional flexibility for other categories of content.

**Key arguments.**
- *Broad support for a baseline, with a strong caveat.* General agreement that a baseline prohibition on universally recognized harms is appropriate — but enumeration alone is insufficient. Participants distinguished "declared constraints" from "structural constraints" ("policy-as-code") built into the infrastructure and paired with ongoing evaluation. A prohibition written into a document but not enforced at runtime was seen as largely cosmetic.
- *Define prohibitions narrowly and precisely.* Vague terms ("harmful content," "violating local law") were criticized as unworkable and potentially dangerous — a clause referencing local law could "constitutionalize" an inequitable local rule. Enforce structurally, e.g. via runtime guardrails at the orchestration layer.
- *Proportional, risk-tiered governance.* Distinguish absolute prohibitions from risk-tiered constraints; the EU AI Act was cited as a useful foundation for risk tiering.
- *Limits of "constitutional AI."* Even a clearly stated red line cannot be guaranteed to hold in all contexts, which shifts emphasis to the evaluative side — measuring how the model performs against the values (e.g., refusal rates).
- *The case for legislating clear harms.* Litigation has been a weak check on corporate harm; where harms are known and uncontroversial it is better to legislate directly. Magnitude of harm should drive how much regulation applies (the nuclear-sector analogy).
- *Global representation and "AI privilege."* A caution against a US/EU-centric frame; any baseline needs a built-in amendment mechanism ("Article V"-style) since "these are the worst models we will ever use."
- *Law-enforcement and managed distribution.* Narrow, highly managed exceptions tied to controlled distribution are a proven pattern.

**Consensus.** A global safety baseline for universally recognized harms (CSAM, WMD-class weapons) is appropriate and broadly supportable; declaration alone is not enough — prohibitions must be enforced structurally and evaluated continuously; distributor responsibility persists regardless; definitions must be narrow and precise.

**Open tension.** Regulation vs. self-regulation; how much jurisdictional flexibility before the baseline frays; whether a single global constitution is feasible; the fact that hard prohibitions cannot be technically guaranteed.

## Issue 2 — Default to Helpfulness vs. Default to Caution

**Question.** When values conflict (safety vs. autonomy, transparency vs. security, access vs. harm prevention), should AI systems default toward action (being as helpful as possible) or toward restraint (being as careful as possible)?

**Working thesis.** Implement "contextual friction": the system flags potential value conflicts for human awareness, influence, or intervention rather than resolving them silently.

**Key arguments.**
- *A human in the loop for every query is impractical.* Value conflicts arise in nearly every interaction; routing every query through a human is not realistic.
- *Reserve friction for high-stakes, time-bounded cases.* For genuine life-or-death situations, an "exigent circumstances" analogy applies; invisible human review already exists at scale, so a human-in-the-loop step for hard conflicts is feasible — provided policies are transparent.
- *A "distributed accountability framework."* Layer traditional regulation, governance-as-infrastructure (policy-as-code), build-time evaluation, and a post-deployment quality-improvement cycle.
- *Preserve human agency as the ultimate architecture.* A distinction between preserving "human agency" and optimizing for "survival of the species"; unpredictable nth-order effects mean caution is warranted, with human agency the governing constraint.
- *Avoid the irreversible; emphasize consent, literacy, and choice.* The strongest caution was against irreversible decisions that bind future generations; decision-information for AI models barely exists compared to, say, car safety ratings, and market concentration limits meaningful user choice.
- *One constitution to govern all was resisted* ("Tower of Babel") in favor of empowering more communities to be builders.

**Consensus.** Defaulting to either pure helpfulness or blanket caution is too blunt — the answer is contextual; per-query human oversight is impractical, so reserve friction for high-stakes/irreversible decisions; be transparent about human review; preserve human agency as the central design constraint.

**Open tension.** Exactly where the "act vs. restrain" line sits; one shared constitution vs. many community-specific ones; whether the current market structure permits meaningful user choice.

**Shared resolution.** "Contextual friction" — surface conflicts for human awareness/intervention instead of resolving them silently — drew broad support as a middle path.

## Issue 3 — Autonomous Violence and Warfare

**Question.** Should AI systems be permitted to carry out autonomous violence or warfare? Is there a zone of agreement between those who see a role for autonomous systems and those who argue for firm prohibitions?

**Working thesis.** Meaningful human oversight, with internationally drawn "red lines" around autonomous warfare.

**Key arguments.**
- *Separate the short term from the long term.* No binding international agreement exists today, and AI is already used in active conflict; defensive parity may be unavoidable in the near term, while bilateral understandings (e.g., US-China) could mature into multilateral agreements.
- *Don't treat AI as wholly unprecedented.* The established law of armed conflict — proportionality and necessity — should remain the baseline.
- *War conduct and peacetime conduct are linked.* Regulating AI in war requires regulating it in peace; habits formed in peacetime carry into wartime.
- *Autonomy is a spectrum, not a binary — and there must be an off switch.* A kill switch was treated as non-negotiable in all present and future cases, because generative systems' outputs cannot be fully predicted.
- *Treaties are necessary but limited.* War is increasingly waged by non-state actors; treaties alone won't suffice.
- *The real problem is autonomy itself — and accountability can't be outsourced.* Humans must remain accountable; accountability cannot be delegated to the AI, with special protection for those (e.g., children) who cannot exercise judgment.
- *Proliferation and the offense/defense balance.* A possible safety path is ensuring defensive countermeasure autonomy outscales offensive autonomy.

**Consensus.** Meaningful human oversight is required and full lethal autonomy is not acceptable; a mandatory, always-available off switch; autonomy is a spectrum to be managed; existing law of armed conflict remains the baseline; humans retain ultimate accountability; AI should be governed in peacetime as well as wartime.

**Open tension.** Enforceability against non-state actors; whether short-term defensive use is acceptable when adversaries deploy first; how novel AI really is relative to existing weapons and law.

## Cross-cutting themes

- **Declaration is not enforcement.** A value written into a constitution means little without structural enforcement and continuous evaluation.
- **Flexibility over rigidity.** A useful AI constitution needs a built-in amendment path.
- **Human agency and accountability are the anchor.**
- **Distribution and managed access are a governance lever.**
- **Global representation matters** — repeated cautions against a US/EU-centric frame.

## Next steps

These results are building blocks toward consensus and feed into the subcommittee's work ahead of the June meeting. Points of consensus are candidates for drafting into provisions; open tensions mark where further deliberation is required.`,
  },
  {
    slug: "cip-whitepaper",
    title: "Whitepaper: Collective Intelligence for Transformative Technology",
    kind: "External Resource",
    source: "Collective Intelligence Project",
    summary:
      "CIP's foundational framing: steering transformative technology (including AI) toward collective benefit by building new institutions that elicit and aggregate human values — balancing safety, progress, and participation. Background for why an AI constitution should be sourced collectively rather than declared.",
    fileUrl: "https://www.cip.org/whitepaper",
    links: [
      { slug: "constitution", relevance: 0.7 },
      { slug: "limitations-misalignment", relevance: 0.7 },
      { slug: "ai-values", relevance: 0.4 },
      { slug: "ai-values-helpful-to-humanity", relevance: 0.5 },
    ],
  },
  {
    slug: "cip-collective-constitutional-ai",
    title: "Collective Constitutional AI",
    kind: "External Resource",
    source: "Collective Intelligence Project (with Anthropic)",
    eventDate: "2023-10-17",
    summary:
      "CIP and Anthropic ran a public deliberation (~1,000 representative Americans via the Polis platform) to draft a constitution, then trained a model on it using Constitutional AI. The first language model aligned to collectively-sourced public input — it showed lower bias across nine social dimensions while matching the baseline on capability. A direct demonstration of how 'commonly agreed upon values' might be determined democratically. Paper: arXiv:2406.07814.",
    fileUrl: "https://www.cip.org/blog/ccai",
    links: [
      { slug: "constitution", relevance: 0.85 },
      { slug: "limitations-misalignment", relevance: 0.9 },
      { slug: "ai-values", relevance: 0.5 },
      { slug: "ai-values-helpful-to-humanity", relevance: 0.6 },
      { slug: "human-rights", relevance: 0.4 },
      { slug: "human-rights-fair-treatment", relevance: 0.6 },
    ],
  },
  {
    slug: "cip-alignment-assemblies",
    title: "Alignment Assemblies",
    kind: "External Resource",
    source: "Collective Intelligence Project",
    summary:
      "Deliberative public assemblies (2023–24) gathering citizen input on AI governance, with partners including OpenAI, Anthropic, and the UK AI Safety Institute committing to take public voice into account — a working model for keeping humans, collectively, responsible for AI's direction.",
    fileUrl: "https://www.cip.org/alignmentassemblies",
    links: [
      { slug: "constitution", relevance: 0.7 },
      { slug: "limitations-misalignment", relevance: 0.7 },
      { slug: "limitations-human-responsibility", relevance: 0.6 },
      { slug: "ai-values-helpful-to-humanity", relevance: 0.4 },
    ],
  },
  {
    slug: "cip-global-dialogues",
    title: "Global Dialogues",
    kind: "External Resource",
    source: "Collective Intelligence Project",
    summary:
      "Recurring multi-country surveys tracking public attitudes toward AI across 70+ countries. Directly addresses the 'global representation / AI privilege' concern raised in the AI Values panel by surfacing diverse, non-US/EU perspectives on how AI should behave.",
    fileUrl: "https://www.cip.org/globaldialogues",
    links: [
      { slug: "constitution", relevance: 0.5 },
      { slug: "ai-values-helpful-to-humanity", relevance: 0.6 },
      { slug: "human-rights-access-ai", relevance: 0.6 },
      { slug: "human-rights-fair-treatment", relevance: 0.6 },
      { slug: "human-rights-transparency", relevance: 0.5 },
    ],
  },
  {
    slug: "cip-roadmap-democratic-ai",
    title: "A Roadmap to Democratic AI",
    kind: "External Resource",
    source: "Collective Intelligence Project",
    eventDate: "2024-01-01",
    summary:
      "CIP's 2024 agenda of concrete steps — to build, research, advocate for, and fund — toward a democratic AI ecosystem that is adaptive, accountable, and safeguards human wellbeing. A living document for field-building beyond the safety/progress/participation camps.",
    fileUrl: "https://www.cip.org/research/ai-roadmap",
    links: [
      { slug: "constitution", relevance: 0.7 },
      { slug: "limitations", relevance: 0.4 },
      { slug: "limitations-human-responsibility", relevance: 0.6 },
    ],
  },
];

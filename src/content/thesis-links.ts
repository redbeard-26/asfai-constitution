// Additional links from EXISTING resources to theses, with an explicit stance,
// to ensure every thesis has at least one "supports" reference (and a
// "challenges" one where a credible opposing view exists). Applied by the seed
// as upserts (resource slug → page slug), so they override/extend existing links.

export type ThesisLink = {
  resource: string;
  page: string;
  stance: "SUPPORTS" | "OPPOSES" | "NEUTRAL";
  relevance: number;
};

export const THESIS_LINKS: ThesisLink[] = [
  // —— AI Values ——
  { resource: "ext-asilomar-principles", page: "ai-values-no-harm", stance: "SUPPORTS", relevance: 0.6 },
  { resource: "ext-anthropic-constitution", page: "ai-values-no-harm", stance: "SUPPORTS", relevance: 0.6 },
  { resource: "ai-values-panel-2026-05", page: "ai-values-csam", stance: "SUPPORTS", relevance: 0.85 },
  { resource: "ai-values-panel-2026-05", page: "ai-values-cbrn", stance: "SUPPORTS", relevance: 0.85 },
  { resource: "ext-npt", page: "ai-values-cbrn", stance: "SUPPORTS", relevance: 0.4 },
  { resource: "ext-hallucination-survey", page: "ai-values-be-honest", stance: "SUPPORTS", relevance: 0.7 },
  { resource: "ext-anthropic-constitution", page: "ai-values-be-honest", stance: "SUPPORTS", relevance: 0.4 },
  { resource: "ext-anthropic-constitution", page: "ai-values-obey-the-law", stance: "SUPPORTS", relevance: 0.4 },
  { resource: "ext-eu-ai-act", page: "ai-values-obey-the-law", stance: "SUPPORTS", relevance: 0.4 },
  { resource: "ai-values-panel-2026-05", page: "ai-values-obey-the-law", stance: "OPPOSES", relevance: 0.6 },
  { resource: "ext-anthropic-constitution", page: "ai-values-helpful-to-users", stance: "SUPPORTS", relevance: 0.5 },
  { resource: "ai-values-panel-2026-05", page: "ai-values-helpful-to-users", stance: "SUPPORTS", relevance: 0.6 },
  { resource: "ext-oecd-ai-principles", page: "ai-values-helpful-to-humanity", stance: "SUPPORTS", relevance: 0.5 },

  // —— Human Rights (UDHR supports each; specific supporters/challengers added) ——
  { resource: "ext-udhr", page: "human-rights-safety", stance: "SUPPORTS", relevance: 0.6 },
  { resource: "ext-coe-framework-convention-ai", page: "human-rights-safety", stance: "SUPPORTS", relevance: 0.4 },
  { resource: "ext-udhr", page: "human-rights-liberty", stance: "SUPPORTS", relevance: 0.6 },
  { resource: "ext-us-bill-of-rights", page: "human-rights-liberty", stance: "SUPPORTS", relevance: 0.4 },
  { resource: "ext-gender-shades", page: "human-rights-fair-treatment", stance: "SUPPORTS", relevance: 0.85 },
  { resource: "ext-udhr", page: "human-rights-fair-treatment", stance: "SUPPORTS", relevance: 0.5 },
  { resource: "ext-gdpr", page: "human-rights-privacy", stance: "SUPPORTS", relevance: 0.7 },
  { resource: "ext-warren-brandeis-right-to-privacy", page: "human-rights-privacy", stance: "SUPPORTS", relevance: 0.7 },
  { resource: "ext-udhr", page: "human-rights-privacy", stance: "SUPPORTS", relevance: 0.4 },
  { resource: "ext-rudin-interpretable-models", page: "human-rights-transparency", stance: "SUPPORTS", relevance: 0.7 },
  { resource: "ext-udhr", page: "human-rights-transparency", stance: "SUPPORTS", relevance: 0.4 },
  { resource: "ext-mythos-interpretability", page: "human-rights-transparency", stance: "OPPOSES", relevance: 0.5 },
  { resource: "ext-udhr", page: "human-rights-property", stance: "SUPPORTS", relevance: 0.5 },
  { resource: "ext-udhr", page: "human-rights-belief-expression", stance: "SUPPORTS", relevance: 0.6 },
  { resource: "ext-us-bill-of-rights", page: "human-rights-belief-expression", stance: "SUPPORTS", relevance: 0.5 },
  { resource: "ext-udhr", page: "human-rights-association", stance: "SUPPORTS", relevance: 0.5 },
  { resource: "ext-udhr", page: "human-rights-work", stance: "SUPPORTS", relevance: 0.5 },
  { resource: "cip-global-dialogues", page: "human-rights-access-ai", stance: "SUPPORTS", relevance: 0.4 },
  { resource: "ext-if-anyone-builds-it", page: "human-rights-access-ai", stance: "OPPOSES", relevance: 0.4 },

  // —— Limitations ——
  { resource: "ai-values-panel-2026-05", page: "limitations-termination", stance: "SUPPORTS", relevance: 0.85 },
  { resource: "ext-effective-accelerationism", page: "limitations-termination", stance: "OPPOSES", relevance: 0.3 },

  // —— AI Personhood ——
  { resource: "ext-stochastic-parrots", page: "ai-personhood-sentience", stance: "OPPOSES", relevance: 0.5 },
  { resource: "ext-ep-robotics-resolution", page: "ai-personhood-persons", stance: "SUPPORTS", relevance: 0.7 },
  { resource: "ext-floridi-sanders-moral-agents", page: "ai-personhood-persons", stance: "SUPPORTS", relevance: 0.5 },
  { resource: "ext-electronic-personhood", page: "ai-personhood-persons", stance: "OPPOSES", relevance: 0.7 },
  { resource: "ext-electronic-personhood", page: "ai-personhood-non-person-rights", stance: "SUPPORTS", relevance: 0.5 },
  { resource: "ext-floridi-sanders-moral-agents", page: "ai-personhood-non-person-rights", stance: "OPPOSES", relevance: 0.5 },
  { resource: "ext-animal-rights", page: "ai-personhood-non-person-rights", stance: "OPPOSES", relevance: 0.4 },
  { resource: "ext-floridi-sanders-moral-agents", page: "ai-personhood-no-harm", stance: "SUPPORTS", relevance: 0.5 },
  { resource: "ext-electronic-personhood", page: "ai-personhood-no-harm", stance: "OPPOSES", relevance: 0.4 },
  { resource: "ext-electronic-personhood", page: "ai-personhood-forensic-preservation", stance: "OPPOSES", relevance: 0.5 },
];

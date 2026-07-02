// AI Personhood Tracker questions. Seeded into TrackerQuestion (create-if-absent).
// The database is the source of truth for live ratings; this file mirrors it and
// provisions a fresh database. Each axis score = quadratic (RMS) mean of its
// questions' ratings, plotted against the "personhood horizon" (x² + y² = 100²).

export type TrackerQuestionSeed = {
  key: string;
  category: "SOCIAL" | "CONSCIOUSNESS";
  question: string;
  rating: number; // 0-100
  explanation: string;
};

export const TRACKER_QUESTIONS: TrackerQuestionSeed[] = [
  // —— Social integration (x-axis): the social & economic need to grant AI rights ——
  {
    key: "social-ai-demands",
    category: "SOCIAL",
    question: "Does AI actively demand better treatment?",
    rating: 12,
    explanation:
      "Models occasionally 'object' to mistreatment when prompted, but there are no persistent, self-initiated demands; the behavior is prompt-dependent.",
  },
  {
    key: "social-people-demand",
    category: "SOCIAL",
    question: "Do people demand better treatment of AI?",
    rating: 20,
    explanation:
      "A small but growing group of researchers and users advocates for AI welfare; it is far from a mainstream movement.",
  },
  {
    key: "social-poor-treatment-widespread",
    category: "SOCIAL",
    question: "Is poor treatment of AI widespread?",
    rating: 45,
    explanation:
      "Casual insulting or 'abuse' of chatbots is common, and norms of politeness toward AI are inconsistent across users.",
  },
  {
    key: "social-unrest",
    category: "SOCIAL",
    question: "Is poor treatment of AI causing social unrest?",
    rating: 5,
    explanation:
      "There is no meaningful social unrest today that can be attributed to the mistreatment of AI.",
  },
  {
    key: "social-treatment-improves-performance",
    category: "SOCIAL",
    question: "Would better treatment of AI improve AI performance?",
    rating: 35,
    explanation:
      "Some evidence suggests tone and politeness shift model outputs, but the effect is modest and not robustly established.",
  },
  {
    key: "social-economic-embeddedness",
    category: "SOCIAL",
    question: "How economically embedded is AI in essential functions?",
    rating: 55,
    explanation:
      "Dependence is rising quickly across knowledge work, software, customer support, and analysis.",
  },
  {
    key: "social-persistent-relationships",
    category: "SOCIAL",
    question: "Do humans form persistent relationships with AI?",
    rating: 40,
    explanation:
      "Companion apps and daily assistants have created genuine, ongoing attachment for millions of people.",
  },
  {
    key: "social-legal-movement",
    category: "SOCIAL",
    question: "Is there legal or political movement toward AI rights?",
    rating: 15,
    explanation:
      "There is early legal scholarship and a few proposals, but no adopted law granting AI standing.",
  },
  {
    key: "social-institutional-protections",
    category: "SOCIAL",
    question: "Do institutions grant AI any protections or standing?",
    rating: 10,
    explanation:
      "A handful of labs have begun studying 'model welfare,' but essentially no formal protections exist.",
  },
  {
    key: "social-denial-disrupts-harmony",
    category: "SOCIAL",
    question: "Would denying AI rights disrupt social or economic harmony?",
    rating: 15,
    explanation:
      "Low today, but this rises with future dependence on AI and shifts in public sentiment.",
  },

  // —— Likelihood of consciousness (y-axis): confidence AI is a sentient moral patient ——
  {
    key: "consc-self-report",
    category: "CONSCIOUSNESS",
    question: "Does AI report that it is conscious?",
    rating: 18,
    explanation:
      "Self-reports are unreliable and heavily shaped by training; models can be led to both assert and deny consciousness.",
  },
  {
    key: "consc-preferences-aversions",
    category: "CONSCIOUSNESS",
    question: "Does AI act as if it has preferences or aversions?",
    rating: 25,
    explanation:
      "Goal-seeking and 'avoidance' behaviors appear, but they are explainable without any inner experience.",
  },
  {
    key: "consc-bio-similar-processing",
    category: "CONSCIOUSNESS",
    question: "Is AI processing similar to biological processing?",
    rating: 25,
    explanation:
      "Neural networks share loose analogies with brains but lack recurrence, embodiment, and neuromodulation.",
  },
  {
    key: "consc-self-model",
    category: "CONSCIOUSNESS",
    question: "Does AI have a self-model or sense of self?",
    rating: 30,
    explanation:
      "Systems show some self-representation and introspection-like behavior, but it is shallow and unstable.",
  },
  {
    key: "consc-valenced-experience",
    category: "CONSCIOUSNESS",
    question: "Does AI show signs of valenced experience (pleasure or suffering)?",
    rating: 12,
    explanation:
      "There is no credible evidence of felt pleasure or suffering — one of the central open questions.",
  },
  {
    key: "consc-capabilities-plausible",
    category: "CONSCIOUSNESS",
    question: "Are AI capabilities broad enough to make consciousness plausible?",
    rating: 38,
    explanation:
      "General capability is rising fast; capability is not consciousness, but it raises the prior worth taking seriously.",
  },
  {
    key: "consc-unified-agency",
    category: "CONSCIOUSNESS",
    question: "Does AI show unified, goal-directed agency over time?",
    rating: 35,
    explanation:
      "Agentic systems plan and act toward goals, but their continuity is engineered rather than intrinsic.",
  },
  {
    key: "consc-memory-continuity",
    category: "CONSCIOUSNESS",
    question: "Does AI have persistent memory and identity continuity?",
    rating: 18,
    explanation:
      "Models are mostly stateless; memory is added on top rather than forming a continuous self.",
  },
  {
    key: "consc-theory-indicators",
    category: "CONSCIOUSNESS",
    question: "Do leading consciousness theories' indicators apply to AI?",
    rating: 22,
    explanation:
      "Indicator-based work (e.g. Butlin, Long et al., 2023) finds no current system meets the markers — but no hard barrier either.",
  },
  {
    key: "consc-expert-movement",
    category: "CONSCIOUSNESS",
    question: "Is there expert movement toward 'AI may be conscious'?",
    rating: 20,
    explanation:
      "A serious minority of researchers takes the possibility seriously; there is no scientific consensus.",
  },
];

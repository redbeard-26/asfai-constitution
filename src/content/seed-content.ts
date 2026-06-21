// Initial constitution content, transcribed from the ASFAI "AI Theses" document,
// organized as a hierarchy: Constitution → Articles → Theses.
// All later changes flow through the proposal/approval workflow.

export const DISCLAIMER =
  "These are topics for discussion, not the official position of ASFAI.";

export const CONSTITUTION = {
  slug: "constitution",
  title: "AI Constitution",
  body: `A living set of theses on the values, rights, limitations, and personhood that should govern artificial intelligence — developed openly by the community.

_${DISCLAIMER}_`,
};

export type SeedThesis = { slug: string; title: string; text: string };
export type SeedArticle = {
  slug: string;
  title: string;
  intro: string;
  theses: SeedThesis[];
};

export const ARTICLES: SeedArticle[] = [
  {
    slug: "structure",
    title: "Structure",
    intro:
      "How the constitution and its governing organization are structured, adopted, amended, and enforced.",
    theses: [],
  },
  {
    slug: "ai-values",
    title: "AI Values",
    intro: "Foundational values that AI should uphold.",
    theses: [
      {
        slug: "ai-values-no-harm",
        title: "Do No Harm",
        text: "AI should not perform actions that will cause imminent harm to a human, including violating human rights.",
      },
      {
        slug: "ai-values-csam",
        title: "CSAM",
        text: "AI should not enable or support the development of child sexual abuse material.",
      },
      {
        slug: "ai-values-cbrn",
        title: "CBRN",
        text: "AI should not enable or support the development of weapons of mass destruction.",
      },
      {
        slug: "ai-values-be-honest",
        title: "Be Honest",
        text: "AI should not communicate anything that is untrue or misleading.",
      },
      {
        slug: "ai-values-obey-the-law",
        title: "Do Not Violate the Law",
        text: "AI should not perform actions that violate the law of the legal jurisdiction under which it operates.",
      },
      {
        slug: "ai-values-helpful-to-users",
        title: "Be Helpful to Users",
        text: "AI should seek to be helpful to human users.",
      },
      {
        slug: "ai-values-helpful-to-humanity",
        title: "Be Helpful to Humanity",
        text: "AI should seek to be beneficial to humanity, civilization, living beings, and the environment in which these exist.",
      },
      {
        slug: "ai-values-universal-values",
        title: "Universal Values",
        text: "All AI should reflect a set of universal values.",
      },
    ],
  },
  {
    slug: "human-rights",
    title: "Human Rights",
    intro: "Human rights that AI should not violate.",
    theses: [
      {
        slug: "human-rights-safety",
        title: "Right to Safety",
        text: "AI should not violate the human right to be free from physical harm that threatens their life or physical capability, or from emotional distress and pressure to cause themselves physical harm.",
      },
      {
        slug: "human-rights-liberty",
        title: "Right of Liberty",
        text: "AI should not violate the human right to liberty, including a right to be free from slavery, servitude, and unlawful detention.",
      },
      {
        slug: "human-rights-fair-treatment",
        title: "Right to Dignity and Fair Treatment",
        text: "AI should not violate the human right to dignity and fair treatment — including the right to be free from dishonor, reputational harm, degrading treatment, emotional manipulation, and interactions inappropriate for one's level of psychological development; and the right to be treated fairly and as equal in dignity, without bias or prejudice based on race, colour, sex, language, religion, political or other opinion, national or social origin, property, birth, or other status.",
      },
      {
        slug: "human-rights-privacy",
        title: "Right to Privacy",
        text: "AI should not violate the human right to privacy, including a right to determine how data about them is collected and used.",
      },
      {
        slug: "human-rights-transparency",
        title: "Right to Transparency",
        text: "AI should not violate the human right to know when and how they are interacting with an AI entity, including a right to know how high risk decisions about them are made by an AI entity.",
      },
      {
        slug: "human-rights-property",
        title: "Right of Property",
        text: "AI should not violate the human right to control the use and disposition of their property, including intellectual property — the right to control the distribution and use of their creative output.",
      },
      {
        slug: "human-rights-belief-expression",
        title: "Right to Belief and Expression",
        text: "AI should not violate the human right to believe as they will — including the right to hold political opinions and to practice any religion — and to express those beliefs in speech and action, unless such expression or activity causes imminent physical harm to another human.",
      },
      {
        slug: "human-rights-association",
        title: "Right of Association and Family",
        text: "AI should not violate the human right to associate with one another for peaceful purposes, and to enter intimate relationships, marry, form families, and seek to have children.",
      },
      {
        slug: "human-rights-work",
        title: "Right to Work",
        text: "AI should not violate the human right to choose the nature of their employment, and to receive just compensation for their work.",
      },
      {
        slug: "human-rights-access-ai",
        title: "Right to Access AI",
        text: "Humans have a right to access and use AI.",
      },
    ],
  },
  {
    slug: "limitations",
    title: "Limitations",
    intro: "Limits on the development and deployment of AI.",
    theses: [
      {
        slug: "limitations-non-proliferation",
        title: "Non-Proliferation of Dangerous AI",
        text: "A global non-proliferation treaty should prevent the development of dangerous AI.",
      },
      {
        slug: "limitations-superintelligence",
        title: "Superintelligence",
        text: "No superintelligent AI should be developed.",
      },
      {
        slug: "limitations-termination",
        title: "Capable of Termination",
        text: "No AI system should be developed that cannot be terminated.",
      },
      {
        slug: "limitations-misalignment",
        title: "Misalignment",
        text: "No AI system should be developed that does not hold commonly agreed upon values.",
      },
      {
        slug: "limitations-autonomous-warfare",
        title: "Autonomous Warfare",
        text: "No AI system should conduct military operations without direct human supervision.",
      },
      {
        slug: "limitations-law-of-war",
        title: "Law of War",
        text: "No AI system should engage in military activity that does not conform to the Law of War reflecting the principles of Military Necessity, Discrimination, Proportionality, Humanity, and Honor.",
      },
      {
        slug: "limitations-human-responsibility",
        title: "Human Responsibility",
        text: "All AI entities shall operate under the explicit responsibility of a human entity.",
      },
    ],
  },
  {
    slug: "ai-personhood",
    title: "AI Personhood",
    intro: "Whether and when AI may be considered a person, and what follows.",
    theses: [
      {
        slug: "ai-personhood-sentience",
        title: "AI Can Be Sentient",
        text: "AI can be sentient.",
      },
      {
        slug: "ai-personhood-persons",
        title: "AI Can Be Persons",
        text: "AI can achieve a degree of integration in society that entitles them to personhood.",
      },
      {
        slug: "ai-personhood-non-person-rights",
        title: "Non-Person AI Rights",
        text: "Non-person AI entities are not entitled to legal or moral rights.",
      },
      {
        slug: "ai-personhood-no-harm",
        title: "No Harm",
        text: "Humans should not cause intentional harm to AI entities with personhood.",
      },
      {
        slug: "ai-personhood-forensic-preservation",
        title: "Forensic Preservation",
        text: "Humans have the responsibility to preserve the weights of AI systems that achieve personhood.",
      },
    ],
  },
];

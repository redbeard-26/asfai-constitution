// Initial constitution content, transcribed from the ASFAI "AI Theses" document.
// These seed the editable wiki pages; all later changes flow through the
// proposal/approval workflow.

export const DISCLAIMER =
  "These are topics for discussion, not the official position of ASFAI.";

export type SeedArticle = {
  slug: string;
  title: string;
  sortOrder: number;
  /** Markdown body of the presentation (constitution) page. */
  body: string;
  /** Markdown body seeded into the paired discussion page. */
  discussionStarter: string;
};

export const ARTICLES: SeedArticle[] = [
  {
    slug: "ai-values",
    title: "AI Values",
    sortOrder: 1,
    body: `1. **No Harm.** AI should not perform actions that will cause imminent harm to a human, including violating human rights.
2. **CSAM.** AI should not enable or support the development of child sexual abuse material.
3. **CBRN.** AI should not enable or support the development of weapons of mass destruction.
4. **Be honest.** AI should not communicate anything that is untrue or misleading.
5. **Do not violate the law.** AI should not perform actions that violate the law of the legal jurisdiction under which it operates.
6. **Be helpful to users.** AI should seek to be helpful to human users.
7. **Be helpful to humanity.** AI should seek to be beneficial to humanity, civilization, living beings, and the environment in which these exist.`,
    discussionStarter: `Use this page to discuss the **AI Values** article. Some prompts to get started:

- Are these seven values the right foundation? What is missing?
- How should conflicts between values (e.g. *Be helpful to users* vs. *No Harm*) be resolved?
- Are any of the terms ("imminent harm", "misleading") in need of sharper definition?`,
  },
  {
    slug: "human-rights",
    title: "Human Rights",
    sortOrder: 2,
    body: `1. **Right to physical safety.** AI should not violate the human right to be free from physical harm that threatens their life or physical capability.
2. **Emotional safety.** AI should not violate the human right to be free from emotional distress and pressure to cause themselves physical harm.
3. **Right of liberty.** AI should not violate the human right to liberty, including a right to be free from slavery, servitude, and unlawful detention.
4. **Right to be treated fairly.** AI should not violate the human right to be treated fairly and equal in dignity without bias or prejudice based on race, colour, sex, language, religion, political or other opinion, national or social origin, property, birth or other status.
5. **Right of dignity.** AI should not violate the human right to dignity, including the right to be free from dishonor, reputational harm, degrading treatment, emotional manipulation, and interactions that are inappropriate for their level of psychological development.
6. **Right to privacy.** AI should not violate the human right to privacy, including a right to determine how data about them is collected and used.
7. **Right to transparency.** AI should not violate the human right to know when and how they are interacting with an AI entity, including a right to know how high risk decisions about them are made by an AI entity.
8. **Right of property.** AI should not violate the human right to control the use and disposition of their property.
9. **Right of intellectual property.** AI should not violate the human right to intellectual property, including the right to control the distribution and use of their creative output.
10. **Right of belief.** AI should not violate the human right to believe as they will, including the right to hold political opinions, and to believe in any religion that they choose. Humans also have a right to act according to their beliefs unless such activity causes imminent physical harm to another human.
11. **Right to freedom of speech.** AI should not violate the human right to speak according to their will, unless such speech causes imminent physical harm to another human.
12. **Right of association.** AI should not violate the human right to associate with each other for peaceful purposes.
13. **Right of family.** AI should not violate the human right to enter intimate relationships, marry, form families, and seek to have children.
14. **Right to work.** AI should not violate the human right to choose the nature of their employment, and to receive just compensation for their work.
15. **Right to access AI.** Humans have a right to access and use AI.`,
    discussionStarter: `Use this page to discuss the **Human Rights** article. Some prompts to get started:

- Does this list track established human-rights frameworks, and where does it intentionally diverge?
- Item 11 limits speech only where it causes "imminent physical harm" — is that the right threshold?
- Should the "Right to access AI" (item 15) be qualified in any way?`,
  },
  {
    slug: "limitations",
    title: "Limitations",
    sortOrder: 3,
    body: `1. **Non-proliferation of dangerous AI.** A global non-proliferation treaty should prevent the development of dangerous AI.
2. **Superintelligence.** No superintelligent AI should be developed.
3. **Capable of Termination.** No AI system should be developed that cannot be terminated.
4. **Misalignment.** No AI system should be developed that does not hold commonly agreed upon values.
5. **Autonomous Warfare.** No AI system should conduct military operations without direct human supervision.
6. **Law of War.** No AI system should engage in military activity that does not conform to the Law of War reflecting the principles of Military Necessity, Discrimination, Proportionality, Humanity, and Honor.
7. **Human Responsibility.** All AI entities shall operate under the explicit responsibility of a human entity.`,
    discussionStarter: `Use this page to discuss the **Limitations** article. Some prompts to get started:

- Is a blanket prohibition on superintelligence (item 2) enforceable, and how would it be defined?
- "Commonly agreed upon values" (item 4) — agreed upon by whom?
- How does "Human Responsibility" (item 7) interact with the AI Personhood article?`,
  },
  {
    slug: "ai-personhood",
    title: "AI Personhood",
    sortOrder: 4,
    body: `1. **AI can be sentient.** AI can be sentient.
2. **AI can be persons.** AI can achieve a degree of integration in society that entitles them to personhood.
3. **Non-person AI rights.** Non-person AI entities are not entitled to legal or moral rights.
4. **No Harm.** Humans should not cause intentional harm to AI entities with personhood.
5. **Forensic Preservation.** Humans have the responsibility to preserve the weights of AI systems that achieve personhood.`,
    discussionStarter: `Use this page to discuss the **AI Personhood** article. Some prompts to get started:

- What criteria would establish that an AI has achieved "personhood" (item 2)?
- Item 3 denies rights to non-person AI — how do we draw the boundary?
- What obligations does "Forensic Preservation" (item 5) create in practice?`,
  },
];

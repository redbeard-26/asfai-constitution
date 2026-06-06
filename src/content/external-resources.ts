// External resources extracted from the ASFAI "Resource List" (Drive: Resources
// folder). Only items with a real, public URL are included. Each links to the
// topics it informs with a judged relevance (0-1).
import type { SeedDocument } from "@/content/documents";

export const EXTERNAL_RESOURCES: SeedDocument[] = [
  // —— Constitutional structure ——
  {
    slug: "ext-us-constitution",
    title: "Constitution of the United States",
    kind: "External Resource",
    source: "U.S. Senate",
    summary:
      "The founding charter of U.S. government — a reference point for constitutional structure, enumerated powers, and amendment processes.",
    fileUrl:
      "https://www.senate.gov/about/origins-foundations/senate-and-constitution/constitution.htm",
    links: [{ slug: "constitution", relevance: 0.5 }],
  },
  {
    slug: "ext-principles-constitutional-structure",
    title: "Principles of Constitutional Structure",
    kind: "External Resource",
    source: "University of Georgia School of Law",
    summary:
      "Scholarship on how constitutions are structured — separation of powers, federalism, and entrenchment.",
    fileUrl: "https://digitalcommons.law.uga.edu/books/163/",
    links: [{ slug: "constitution", relevance: 0.4 }],
  },
  {
    slug: "ext-natural-law-theories",
    title: "Natural Law Theories (Stanford Encyclopedia of Philosophy)",
    kind: "External Resource",
    source: "Stanford Encyclopedia of Philosophy",
    summary:
      "Overview of natural-law approaches to morality and law — relevant to grounding rights and values in something beyond positive enactment.",
    fileUrl: "https://plato.stanford.edu/entries/natural-law-theories/",
    links: [
      { slug: "constitution", relevance: 0.4 },
      { slug: "ai-values", relevance: 0.3 },
    ],
  },
  {
    slug: "ext-legal-positivism",
    title: "Legal Positivism (Stanford Encyclopedia of Philosophy)",
    kind: "External Resource",
    source: "Stanford Encyclopedia of Philosophy",
    summary:
      "The view that law's validity derives from social sources rather than morality — a counterpoint to natural law for constitutional grounding.",
    fileUrl: "https://plato.stanford.edu/entries/legal-positivism/",
    links: [{ slug: "constitution", relevance: 0.4 }],
  },

  // —— AI values & ethics ——
  {
    slug: "ext-anthropic-constitution",
    title: "Anthropic's Constitution (Claude's Constitution)",
    kind: "External Resource",
    source: "Anthropic",
    summary:
      "The published set of principles Anthropic uses to train Claude via Constitutional AI — a concrete example of values written for a model.",
    fileUrl: "https://www.anthropic.com/constitution",
    links: [
      { slug: "constitution", relevance: 0.7 },
      { slug: "ai-values", relevance: 0.75 },
      { slug: "limitations-misalignment", relevance: 0.6 },
    ],
  },
  {
    slug: "ext-three-laws-of-robotics",
    title: "Three Laws of Robotics",
    kind: "External Resource",
    source: "Wikipedia",
    summary:
      "Asimov's fictional laws — an early, influential framing of hard behavioral constraints on machines and their limits.",
    fileUrl: "https://en.wikipedia.org/wiki/Three_Laws_of_Robotics",
    links: [
      { slug: "ai-values", relevance: 0.5 },
      { slug: "ai-values-no-harm", relevance: 0.6 },
    ],
  },
  {
    slug: "ext-doing-allowing-harm",
    title: "Doing vs. Allowing Harm (Stanford Encyclopedia of Philosophy)",
    kind: "External Resource",
    source: "Stanford Encyclopedia of Philosophy",
    summary:
      "The moral distinction between causing harm and merely allowing it — directly relevant to how a 'No Harm' duty should be drawn.",
    fileUrl: "https://plato.stanford.edu/entries/doing-allowing/",
    links: [{ slug: "ai-values-no-harm", relevance: 0.6 }],
  },
  {
    slug: "ext-deontological-ethics",
    title: "Deontological Ethics (Stanford Encyclopedia of Philosophy)",
    kind: "External Resource",
    source: "Stanford Encyclopedia of Philosophy",
    summary:
      "Duty-based ethics — a foundation for rule-like constraints on AI behavior.",
    fileUrl: "https://plato.stanford.edu/entries/ethics-deontological/",
    links: [{ slug: "ai-values", relevance: 0.5 }],
  },
  {
    slug: "ext-consequentialism",
    title: "Consequentialism (Stanford Encyclopedia of Philosophy)",
    kind: "External Resource",
    source: "Stanford Encyclopedia of Philosophy",
    summary:
      "Outcome-based ethics — a foundation for 'be beneficial' duties and for weighing aggregate welfare.",
    fileUrl: "https://plato.stanford.edu/entries/consequentialism/",
    links: [
      { slug: "ai-values", relevance: 0.5 },
      { slug: "ai-values-helpful-to-humanity", relevance: 0.4 },
    ],
  },
  {
    slug: "ext-oecd-ai-principles",
    title: "OECD AI Principles (Recommendation on AI, OECD/LEGAL/0449)",
    kind: "External Resource",
    source: "OECD",
    summary:
      "Intergovernmental principles (2019, updated 2024) for trustworthy AI that respects human rights and democratic values — adopted by 40+ countries.",
    fileUrl: "https://oecd.ai/en/ai-principles",
    links: [
      { slug: "ai-values", relevance: 0.6 },
      { slug: "constitution", relevance: 0.5 },
    ],
  },
  {
    slug: "ext-unesco-ethics-of-ai",
    title: "UNESCO Recommendation on the Ethics of Artificial Intelligence",
    kind: "External Resource",
    source: "UNESCO",
    summary:
      "The first global standard-setting instrument on AI ethics (2021), emphasizing human rights, dignity, and vulnerable groups.",
    fileUrl: "https://unesdoc.unesco.org/ark:/48223/pf0000380455",
    links: [
      { slug: "ai-values", relevance: 0.5 },
      { slug: "human-rights", relevance: 0.6 },
      { slug: "constitution", relevance: 0.4 },
    ],
  },
  {
    slug: "ext-ey-responsible-ai-principles",
    title: "EY Responsible AI Principles",
    kind: "External Resource",
    source: "Ernst & Young",
    summary:
      "A private-sector framework of responsible-AI principles for development and deployment.",
    fileUrl:
      "https://www.ey.com/content/dam/ey-unified-site/ey-com/en-gl/insights/ai/documents/ey-gl-responsible-ai-principles-09-2024.pdf",
    links: [{ slug: "ai-values", relevance: 0.4 }],
  },

  // —— Governance frameworks & risk ——
  {
    slug: "ext-eu-ai-act",
    title: "EU Artificial Intelligence Act (Regulation (EU) 2024/1689)",
    kind: "External Resource",
    source: "European Union (EUR-Lex)",
    summary:
      "The EU's risk-tiered AI law — prohibitions, high-risk obligations, and transparency duties; a leading model for proportional AI governance.",
    fileUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
    links: [
      { slug: "limitations", relevance: 0.6 },
      { slug: "constitution", relevance: 0.5 },
      { slug: "human-rights", relevance: 0.4 },
    ],
  },
  {
    slug: "ext-nist-ai-rmf",
    title: "NIST AI Risk Management Framework (AI RMF 1.0)",
    kind: "External Resource",
    source: "U.S. National Institute of Standards and Technology",
    summary:
      "A voluntary framework for governing, mapping, measuring, and managing AI risks across the system lifecycle.",
    fileUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
    links: [
      { slug: "limitations", relevance: 0.5 },
      { slug: "ai-values", relevance: 0.4 },
    ],
  },
  {
    slug: "ext-coe-framework-convention-ai",
    title:
      "Council of Europe Framework Convention on AI and Human Rights, Democracy and the Rule of Law (CETS 225)",
    kind: "External Resource",
    source: "Council of Europe",
    summary:
      "The first international legally binding treaty ensuring AI activities are consistent with human rights, democracy, and the rule of law.",
    fileUrl:
      "https://www.coe.int/en/web/artificial-intelligence/the-framework-convention-on-artificial-intelligence",
    links: [
      { slug: "human-rights", relevance: 0.6 },
      { slug: "constitution", relevance: 0.5 },
      { slug: "limitations", relevance: 0.4 },
    ],
  },
  {
    slug: "ext-mit-ai-risk-repository",
    title: "MIT AI Risk Repository",
    kind: "External Resource",
    source: "MIT",
    summary:
      "A comprehensive, living database categorizing risks from AI — useful for mapping the constitution's limitations to documented harms.",
    fileUrl: "https://airisk.mit.edu/",
    links: [
      { slug: "limitations", relevance: 0.6 },
      { slug: "constitution", relevance: 0.4 },
    ],
  },
  {
    slug: "ext-house-ai-task-force-report",
    title: "Bipartisan House Task Force Report on Artificial Intelligence (2024)",
    kind: "External Resource",
    source: "U.S. House of Representatives",
    summary:
      "A bipartisan U.S. congressional report surveying AI policy issues and recommendations across sectors.",
    fileUrl: "https://www.speaker.gov/wp-content/uploads/2024/12/AI-Task-Force-Report-FINAL.pdf",
    links: [
      { slug: "constitution", relevance: 0.5 },
      { slug: "limitations", relevance: 0.4 },
    ],
  },

  // —— Human rights ——
  {
    slug: "ext-udhr",
    title: "Universal Declaration of Human Rights",
    kind: "External Resource",
    source: "United Nations",
    summary:
      "The foundational 1948 enumeration of universal human rights — the primary reference for the Human Rights article.",
    fileUrl: "https://www.un.org/en/about-us/universal-declaration-of-human-rights",
    links: [
      { slug: "human-rights", relevance: 0.9 },
      { slug: "human-rights-dignity", relevance: 0.5 },
    ],
  },
  {
    slug: "ext-us-bill-of-rights",
    title: "United States Bill of Rights",
    kind: "External Resource",
    source: "U.S. National Archives",
    summary:
      "The first ten amendments to the U.S. Constitution — a model for enumerating protected individual rights.",
    fileUrl: "https://www.archives.gov/founding-docs/bill-of-rights-transcript",
    links: [{ slug: "human-rights", relevance: 0.6 }],
  },
  {
    slug: "ext-canadian-charter",
    title: "Canadian Charter of Rights and Freedoms",
    kind: "External Resource",
    source: "Department of Justice, Canada",
    summary:
      "Canada's constitutional bill of rights — a comparative reference for rights enumeration and reasonable limits.",
    fileUrl: "https://www.justice.gc.ca/eng/csj-sjc/rfc-dlc/ccrf-ccdl/",
    links: [{ slug: "human-rights", relevance: 0.5 }],
  },
  {
    slug: "ext-gdpr",
    title: "General Data Protection Regulation (GDPR, EU 2016/679)",
    kind: "External Resource",
    source: "European Union (EUR-Lex)",
    summary:
      "The EU's data-protection law establishing rights over personal data — foundational for the right to privacy and data control.",
    fileUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    links: [{ slug: "human-rights-privacy", relevance: 0.7 }],
  },
  {
    slug: "ext-warren-brandeis-right-to-privacy",
    title: "The Right to Privacy (Warren & Brandeis, 1890)",
    kind: "External Resource",
    source: "Harvard Law Review",
    summary:
      "The seminal law-review article that articulated a legal right to privacy — 'the right to be let alone.'",
    fileUrl:
      "https://groups.csail.mit.edu/mac/classes/6.805/articles/privacy/Privacy_brand_warr2.html",
    links: [{ slug: "human-rights-privacy", relevance: 0.8 }],
  },
  {
    slug: "ext-westin-privacy-and-freedom",
    title: "Privacy and Freedom (Alan Westin, 1967)",
    kind: "External Resource",
    source: "Alan F. Westin",
    summary:
      "A foundational text defining privacy as control over how information about oneself is shared.",
    fileUrl: "https://www.google.com/books/edition/Privacy_and_Freedom/1RXqoAEACAAJ?hl=en",
    links: [{ slug: "human-rights-privacy", relevance: 0.6 }],
  },
  {
    slug: "ext-us-privacy-act-1974",
    title: "U.S. Privacy Act of 1974",
    kind: "External Resource",
    source: "U.S. Department of Justice",
    summary:
      "U.S. law governing the collection and use of personal data by federal agencies — an early data-rights statute.",
    fileUrl: "https://www.justice.gov/opcl/privacy-act-1974",
    links: [{ slug: "human-rights-privacy", relevance: 0.6 }],
  },

  // —— AI rights & personhood ——
  {
    slug: "ext-consciousness-sep",
    title: "Consciousness (Stanford Encyclopedia of Philosophy)",
    kind: "External Resource",
    source: "Stanford Encyclopedia of Philosophy",
    summary:
      "A survey of theories of consciousness — central to whether and when AI could be considered sentient.",
    fileUrl: "https://plato.stanford.edu/entries/consciousness/",
    links: [{ slug: "ai-personhood-sentience", relevance: 0.6 }],
  },
  {
    slug: "ext-turing-test",
    title: "Turing Test",
    kind: "External Resource",
    source: "Wikipedia",
    summary:
      "Turing's behavioral test for machine intelligence — historical anchor for debates about AI minds and personhood.",
    fileUrl: "https://en.wikipedia.org/wiki/Turing_test",
    links: [{ slug: "ai-personhood-sentience", relevance: 0.5 }],
  },
  {
    slug: "ext-animal-rights",
    title: "Animal Rights",
    kind: "External Resource",
    source: "Wikipedia",
    summary:
      "Overview of moral and legal status for non-human beings — a precedent for reasoning about rights of non-human AI entities.",
    fileUrl: "https://en.wikipedia.org/wiki/Animal_rights",
    links: [
      { slug: "ai-personhood", relevance: 0.5 },
      { slug: "ai-personhood-non-person-rights", relevance: 0.5 },
    ],
  },

  // —— Existential risk, non-proliferation, treaty ——
  {
    slug: "ext-if-anyone-builds-it",
    title: "If Anyone Builds It, Everyone Dies",
    kind: "External Resource",
    source: "Wikipedia",
    summary:
      "Yudkowsky & Soares' book arguing that building superintelligence under current conditions would be catastrophic.",
    fileUrl: "https://en.wikipedia.org/wiki/If_Anyone_Builds_It,_Everyone_Dies",
    links: [
      { slug: "limitations-superintelligence", relevance: 0.7 },
      { slug: "limitations-misalignment", relevance: 0.5 },
    ],
  },
  {
    slug: "ext-ai-2027",
    title: "AI 2027",
    kind: "External Resource",
    source: "AI Futures Project",
    summary:
      "A detailed scenario forecast of rapid AI progress and its risks through 2027 — useful for the superintelligence and misalignment debates.",
    fileUrl: "https://ai-2027.com/",
    links: [{ slug: "limitations-superintelligence", relevance: 0.6 }],
  },
  {
    slug: "ext-npt",
    title: "Treaty on the Non-Proliferation of Nuclear Weapons (NPT)",
    kind: "External Resource",
    source: "Wikipedia",
    summary:
      "The nuclear non-proliferation regime — the most-cited analogy for a global treaty to prevent dangerous AI.",
    fileUrl: "https://en.wikipedia.org/wiki/Treaty_on_the_Non-Proliferation_of_Nuclear_Weapons",
    links: [{ slug: "limitations-non-proliferation", relevance: 0.7 }],
  },

  // —— Legal / policy trackers ——
  {
    slug: "ext-agora-eto",
    title: "AGORA — AI Governance and Regulatory Archive",
    kind: "External Resource",
    source: "Emerging Technology Observatory (ETO)",
    summary:
      "A searchable archive of AI laws, regulations, and standards from around the world.",
    fileUrl: "https://agora.eto.tech/",
    links: [
      { slug: "constitution", relevance: 0.5 },
      { slug: "limitations", relevance: 0.4 },
    ],
  },
];

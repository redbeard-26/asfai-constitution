// Enum-like value sets stored as strings in the database.

export const ROLES = ["VIEWER", "MODERATOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PAGE_TYPES = ["CONSTITUTION", "ARTICLE", "THESIS"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const PAGE_TYPE_LABEL: Record<PageType, string> = {
  CONSTITUTION: "Constitution",
  ARTICLE: "Article",
  THESIS: "Thesis",
};

export const PROPOSAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const COMMENT_STATUSES = ["VISIBLE", "HIDDEN"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

// Whether a resource supports, challenges, or merely discusses a thesis.
export const STANCES = ["SUPPORTS", "NEUTRAL", "OPPOSES"] as const;
export type Stance = (typeof STANCES)[number];

export const STANCE_META: Record<
  Stance,
  { label: string; chip: string }
> = {
  SUPPORTS: { label: "Supports", chip: "border-pro bg-pro-bg text-pro-head" },
  NEUTRAL: { label: "Discusses", chip: "border-rule bg-panel text-muted" },
  OPPOSES: { label: "Challenges", chip: "border-con bg-con-bg text-con-head" },
};

export function stanceMeta(stance: string | null | undefined) {
  return STANCE_META[(stance as Stance) in STANCE_META ? (stance as Stance) : "NEUTRAL"];
}

// Role helpers — ADMIN implies MODERATOR implies VIEWER.
const RANK: Record<Role, number> = { VIEWER: 0, MODERATOR: 1, ADMIN: 2 };

export function hasRole(role: string | null | undefined, min: Role): boolean {
  if (!role || !(role in RANK)) return false;
  return RANK[role as Role] >= RANK[min];
}

export function isModerator(role: string | null | undefined): boolean {
  return hasRole(role, "MODERATOR");
}

export function isAdmin(role: string | null | undefined): boolean {
  return hasRole(role, "ADMIN");
}

// Route helper. The Constitution root lives at "/"; everything else at /p/<slug>.
export function pageHref(page: { slug: string; type: string }): string {
  return page.type === "CONSTITUTION" ? "/" : `/p/${page.slug}`;
}

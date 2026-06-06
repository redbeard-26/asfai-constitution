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

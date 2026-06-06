export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function displayName(
  user: { name?: string | null; email?: string | null } | null | undefined,
): string {
  if (!user) return "Unknown";
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "Unknown";
}

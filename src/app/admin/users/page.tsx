import { redirect } from "next/navigation";

// Admin user management is now combined into the moderation page.
export default function AdminUsersPage() {
  redirect("/moderation");
}

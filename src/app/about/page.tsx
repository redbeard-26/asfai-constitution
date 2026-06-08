import { redirect } from "next/navigation";

// The About content is now the landing page.
export default function AboutPage() {
  redirect("/");
}

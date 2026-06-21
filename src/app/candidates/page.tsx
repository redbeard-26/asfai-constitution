import { redirect } from "next/navigation";

// Candidates are now part of the unified Theses tab.
export default function CandidatesPage() {
  redirect("/theses");
}

import { redirect } from "next/navigation";

// The AI Connector instructions now live in the About page.
export default function ConnectPage() {
  redirect("/#ai-connector");
}

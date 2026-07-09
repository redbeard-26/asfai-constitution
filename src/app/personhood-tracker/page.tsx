import { getPersonhoodTracker } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { PersonhoodTracker } from "@/components/PersonhoodTracker";

export const metadata = {
  title: "Personhood Tracker — AI Constitution",
};

export default async function PersonhoodTrackerPage() {
  const [{ questions, submissions }, user] = await Promise.all([
    getPersonhoodTracker(),
    getSessionUser(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Article V · AI Personhood</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Personhood Tracker
        </h1>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Where does AI stand on two axes: how far it is socially and economically
        integrated (x), and how likely it is to be a sentient moral patient (y)?
        Rate each question below with the sliders, then save your assessment.
        Every submission is public and plots as a dot — click any dot to load that
        assessment into the sliders, and submit again over time to track how your
        view shifts.
      </p>

      <PersonhoodTracker
        questions={questions}
        submissions={submissions}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}

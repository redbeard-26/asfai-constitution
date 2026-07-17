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

      <PersonhoodTracker
        questions={questions}
        submissions={submissions}
        currentUserId={user?.id ?? null}
        intro={
          <p className="text-sm leading-relaxed text-muted">
            <span className="font-bold text-ink">
              Do you think AI entities should be recognized with personhood? Submit your
              answers here!
            </span>{" "}
            Rate each question below on two axes — how far AI is socially and economically
            integrated (the horizontal axis), and how likely it is to be a sentient moral
            patient (the vertical axis). Every submission is public and plots as a dot;
            click any dot to load that assessment into the sliders, and submit again over
            time to track how your view shifts.
          </p>
        }
      />
    </div>
  );
}

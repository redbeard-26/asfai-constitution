import Link from "next/link";
import { castVote } from "@/lib/actions";

/** Up/down vote control with net score. Signed-out users are linked to sign in. */
export function VoteWidget({
  pageId,
  score,
  userVote,
  canVote,
}: {
  pageId: string;
  score: number;
  userVote: number;
  canVote: boolean;
}) {
  if (!canVote) {
    return (
      <Link
        href="/signin"
        title="Sign in to vote"
        className="flex flex-col items-center text-muted hover:text-ink"
      >
        <span aria-hidden>▲</span>
        <span className="font-bold tabular-nums">{score}</span>
        <span aria-hidden>▼</span>
      </Link>
    );
  }
  return (
    <div className="flex flex-col items-center leading-none">
      <form action={castVote}>
        <input type="hidden" name="pageId" value={pageId} />
        <input type="hidden" name="value" value="1" />
        <button
          type="submit"
          aria-label="Upvote"
          className={userVote === 1 ? "text-pro-head" : "text-muted hover:text-pro-head"}
        >
          ▲
        </button>
      </form>
      <span className="my-0.5 font-bold tabular-nums">{score}</span>
      <form action={castVote}>
        <input type="hidden" name="pageId" value={pageId} />
        <input type="hidden" name="value" value="-1" />
        <button
          type="submit"
          aria-label="Downvote"
          className={userVote === -1 ? "text-con-head" : "text-muted hover:text-con-head"}
        >
          ▼
        </button>
      </form>
    </div>
  );
}

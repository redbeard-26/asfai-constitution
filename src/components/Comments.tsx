import Link from "next/link";
import { postComment, deleteOwnComment, setCommentVisibility } from "@/lib/actions";
import { formatDateTime, displayName } from "@/lib/format";

export type CommentData = {
  id: string;
  parentId: string | null;
  authorId: string | null;
  body: string;
  status: string;
  createdAt: Date;
  author: { name: string | null; email: string | null; image: string | null } | null;
};

type Props = {
  pageId: string;
  path: string;
  comments: CommentData[];
  currentUserId: string | null;
  isModerator: boolean;
};

export function Comments({ pageId, path, comments, currentUserId, isModerator }: Props) {
  const byParent = new Map<string, CommentData[]>();
  for (const c of comments) {
    const key = c.parentId ?? "root";
    const arr = byParent.get(key) ?? [];
    arr.push(c);
    byParent.set(key, arr);
  }

  const visibleCount = comments.filter((c) => c.status === "VISIBLE").length;

  function renderNodes(parentKey: string, depth: number): React.ReactNode {
    const nodes = byParent.get(parentKey) ?? [];
    if (nodes.length === 0) return null;
    return (
      <ul className={depth > 0 ? "ml-4 border-l border-rule pl-4" : "space-y-4"}>
        {nodes.map((c) => {
          const hidden = c.status === "HIDDEN";
          const isOwner = currentUserId != null && c.authorId === currentUserId;
          return (
            <li key={c.id} className="mt-4 first:mt-0">
              <div className="border border-rule bg-background p-3">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-bold text-ink">
                    {hidden ? "—" : displayName(c.author)}
                  </span>
                  <span>{formatDateTime(c.createdAt)}</span>
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-ink">
                  {hidden ? (
                    <em className="text-muted">[removed by moderator]</em>
                  ) : (
                    c.body
                  )}
                </div>

                {!hidden && (
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                    {currentUserId && (
                      <details>
                        <summary className="cursor-pointer hover:text-gold-deep">
                          Reply
                        </summary>
                        <CommentForm
                          pageId={pageId}
                          path={path}
                          parentId={c.id}
                          compact
                        />
                      </details>
                    )}
                    {isOwner && (
                      <form action={deleteOwnComment}>
                        <input type="hidden" name="commentId" value={c.id} />
                        <input type="hidden" name="path" value={path} />
                        <button className="hover:text-con-head">Delete</button>
                      </form>
                    )}
                    {isModerator && (
                      <form action={setCommentVisibility}>
                        <input type="hidden" name="commentId" value={c.id} />
                        <input type="hidden" name="path" value={path} />
                        <input type="hidden" name="hide" value="1" />
                        <button className="hover:text-con-head">Hide</button>
                      </form>
                    )}
                  </div>
                )}
                {hidden && isModerator && (
                  <form action={setCommentVisibility} className="mt-2 text-xs">
                    <input type="hidden" name="commentId" value={c.id} />
                    <input type="hidden" name="path" value={path} />
                    <input type="hidden" name="hide" value="0" />
                    <button className="text-muted hover:text-ink">Unhide</button>
                  </form>
                )}
              </div>
              {renderNodes(c.id, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <details open className="section-rule mt-10 pt-3">
      <summary className="kicker cursor-pointer text-base">
        Discussion ({visibleCount})
      </summary>

      <div className="mt-4">
        {currentUserId ? (
          <CommentForm pageId={pageId} path={path} parentId={null} />
        ) : (
          <p className="border border-rule bg-panel p-3 text-sm text-muted">
            <Link href="/signin" className="text-gold-deep hover:underline">
              Sign in
            </Link>{" "}
            to join the discussion.
          </p>
        )}
      </div>

      <div className="mt-6">
        {comments.length === 0 ? (
          <p className="text-sm text-muted">No comments yet.</p>
        ) : (
          renderNodes("root", 0)
        )}
      </div>
    </details>
  );
}

function CommentForm({
  pageId,
  path,
  parentId,
  compact,
}: {
  pageId: string;
  path: string;
  parentId: string | null;
  compact?: boolean;
}) {
  return (
    <form action={postComment} className={compact ? "mt-2" : ""}>
      <input type="hidden" name="pageId" value={pageId} />
      <input type="hidden" name="path" value={path} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea
        name="body"
        required
        rows={compact ? 2 : 3}
        placeholder={parentId ? "Write a reply…" : "Add to the discussion…"}
        className="w-full border border-rule bg-background p-2 text-sm focus:border-gold focus:outline-none"
      />
      <div className="mt-1">
        <button
          type="submit"
          className="rounded bg-gold-deep px-3 py-1.5 text-sm text-background hover:bg-gold"
        >
          {parentId ? "Reply" : "Comment"}
        </button>
      </div>
    </form>
  );
}

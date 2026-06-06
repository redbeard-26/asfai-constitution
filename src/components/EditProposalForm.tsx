"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { proposeEdit } from "@/lib/actions";

export function EditProposalForm({
  pageId,
  baseRevisionId,
  initialContent,
}: {
  pageId: string;
  baseRevisionId: string | null;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <form action={proposeEdit} className="space-y-4">
      <input type="hidden" name="pageId" value={pageId} />
      {baseRevisionId && (
        <input type="hidden" name="baseRevisionId" value={baseRevisionId} />
      )}

      <div className="flex gap-2 border-b border-border text-sm">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={`-mb-px border-b-2 px-3 py-1.5 ${
            tab === "write"
              ? "border-accent font-medium text-foreground"
              : "border-transparent text-muted"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`-mb-px border-b-2 px-3 py-1.5 ${
            tab === "preview"
              ? "border-accent font-medium text-foreground"
              : "border-transparent text-muted"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Textarea stays mounted (hidden in preview) so its value is submitted. */}
      <textarea
        name="proposedContent"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={20}
        required
        className={`w-full rounded-md border border-border p-3 font-mono text-sm focus:border-accent focus:outline-none ${
          tab === "preview" ? "hidden" : ""
        }`}
      />
      {tab === "preview" && (
        <div className="prose prose-neutral max-w-none rounded-md border border-border bg-white p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || "*Nothing to preview.*"}
          </ReactMarkdown>
        </div>
      )}

      <div>
        <label htmlFor="summary" className="block text-sm font-medium">
          Summary of your change <span className="text-muted">(optional)</span>
        </label>
        <input
          id="summary"
          name="summary"
          type="text"
          maxLength={300}
          placeholder="e.g. Clarified the wording of thesis 4"
          className="mt-1 w-full rounded-md border border-border p-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Submit for review
      </button>
    </form>
  );
}

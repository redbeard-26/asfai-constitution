"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Defaults = {
  id?: string;
  title?: string;
  kind?: string;
  eventDate?: string; // yyyy-mm-dd
  summary?: string;
  body?: string;
  fileUrl?: string;
};

export function DocumentForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [body, setBody] = useState(defaults?.body ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");

  const input =
    "mt-1 w-full border border-rule p-2 text-sm focus:border-gold focus:outline-none";
  const label = "block text-sm font-bold text-ink";

  return (
    <form action={action} className="space-y-4">
      {defaults?.id && <input type="hidden" name="documentId" value={defaults.id} />}

      <div>
        <label htmlFor="title" className={label}>
          Title
        </label>
        <input id="title" name="title" required defaultValue={defaults?.title} className={input} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="kind" className={label}>
            Kind
          </label>
          <input
            id="kind"
            name="kind"
            placeholder="Panel Report"
            defaultValue={defaults?.kind ?? "Reference"}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="eventDate" className={label}>
            Date <span className="text-muted">(optional)</span>
          </label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            defaultValue={defaults?.eventDate}
            className={input}
          />
        </div>
      </div>

      <div>
        <label htmlFor="summary" className={label}>
          Summary <span className="text-muted">(optional)</span>
        </label>
        <textarea id="summary" name="summary" rows={2} defaultValue={defaults?.summary} className={input} />
      </div>

      <div>
        <label htmlFor="fileUrl" className={label}>
          Original file URL <span className="text-muted">(optional)</span>
        </label>
        <input
          id="fileUrl"
          name="fileUrl"
          type="url"
          placeholder="https://…"
          defaultValue={defaults?.fileUrl}
          className={input}
        />
      </div>

      <div>
        <span className={label}>Body</span>
        <div className="mt-1 flex gap-2 border-b border-rule text-sm">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`-mb-px border-b-2 px-3 py-1.5 ${tab === "write" ? "border-gold font-bold text-ink" : "border-transparent text-muted"}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`-mb-px border-b-2 px-3 py-1.5 ${tab === "preview" ? "border-gold font-bold text-ink" : "border-transparent text-muted"}`}
          >
            Preview
          </button>
        </div>
        <textarea
          name="body"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={18}
          className={`mt-3 w-full border border-rule p-3 font-mono text-sm focus:border-gold focus:outline-none ${tab === "preview" ? "hidden" : ""}`}
        />
        {tab === "preview" && (
          <div className="prose prose-stone mt-3 max-w-none border border-rule bg-panel p-4 font-serif prose-a:text-gold-deep prose-strong:text-ink">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {body || "*Nothing to preview.*"}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="rounded bg-gold-deep px-4 py-2 text-sm font-bold text-background hover:bg-gold"
      >
        {submitLabel}
      </button>
    </form>
  );
}

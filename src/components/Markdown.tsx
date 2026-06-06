import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders trusted markdown content with document-style typography. */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-accent prose-li:my-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

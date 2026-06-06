import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders trusted markdown content with document-style serif typography. */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-stone max-w-none font-serif prose-headings:font-bold prose-headings:text-ink prose-a:text-gold-deep prose-strong:text-ink prose-li:my-1 prose-li:marker:text-gold-deep">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

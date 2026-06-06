import { diffLines } from "diff";

/** Renders a simple line-based diff between two markdown strings. */
export function Diff({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = diffLines(oldText || "", newText || "");

  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-gray-50 p-3 text-xs leading-relaxed">
      {parts.map((part, i) => {
        const lines = part.value.replace(/\n$/, "").split("\n");
        const cls = part.added
          ? "bg-green-100 text-green-900"
          : part.removed
            ? "bg-red-100 text-red-900"
            : "text-gray-600";
        const sign = part.added ? "+" : part.removed ? "-" : " ";
        return lines.map((line, j) => (
          <div key={`${i}-${j}`} className={cls}>
            <span className="mr-2 select-none opacity-50">{sign}</span>
            {line || " "}
          </div>
        ));
      })}
    </pre>
  );
}

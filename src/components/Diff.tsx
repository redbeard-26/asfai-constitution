import { diffLines } from "diff";

/** Renders a simple line-based diff between two markdown strings.
 *  Additions use the green "pro" palette, removals the terracotta "con". */
export function Diff({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = diffLines(oldText || "", newText || "");

  return (
    <pre className="overflow-x-auto border border-rule bg-background p-3 font-mono text-xs leading-relaxed">
      {parts.map((part, i) => {
        const lines = part.value.replace(/\n$/, "").split("\n");
        const cls = part.added
          ? "bg-pro-bg text-pro-head"
          : part.removed
            ? "bg-con-bg text-con-head"
            : "text-muted";
        const sign = part.added ? "+" : part.removed ? "−" : " ";
        return lines.map((line, j) => (
          <div key={`${i}-${j}`} className={cls}>
            <span className="mr-2 select-none opacity-50">{sign}</span>
            {line || " "}
          </div>
        ));
      })}
    </pre>
  );
}

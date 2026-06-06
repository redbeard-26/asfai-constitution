import Link from "next/link";
import { getNavTree } from "@/lib/data";
import { pageHref } from "@/lib/constants";

/** Constitution → Article → Thesis navigation tree. The active page is
 *  highlighted; the active article's theses are expanded by default. */
export async function Sidebar({ activeSlug }: { activeSlug: string }) {
  const root = await getNavTree().catch(() => null);
  if (!root) return null;

  const linkCls = (active: boolean) =>
    active
      ? "block py-0.5 font-bold text-gold-deep"
      : "block py-0.5 text-muted hover:text-ink";

  return (
    <nav className="text-sm leading-snug">
      <Link href="/" className={linkCls(activeSlug === root.slug)}>
        {root.title}
      </Link>

      <ul className="mt-2 space-y-1">
        {root.children.map((article) => {
          const inBranch =
            activeSlug === article.slug ||
            article.children.some((t) => t.slug === activeSlug);
          return (
            <li key={article.slug}>
              <details open={inBranch}>
                <summary className="cursor-pointer list-none">
                  <span
                    className="kicker text-xs"
                    style={{ fontVariant: "small-caps" }}
                  >
                    ▸{" "}
                  </span>
                  <Link
                    href={pageHref(article)}
                    className={
                      activeSlug === article.slug
                        ? "font-bold text-gold-deep"
                        : "text-ink hover:text-gold-deep"
                    }
                  >
                    {article.title}
                  </Link>
                </summary>
                <ul className="ml-4 border-l border-rule pl-3">
                  {article.children.map((thesis) => (
                    <li key={thesis.slug}>
                      <Link
                        href={pageHref(thesis)}
                        className={linkCls(activeSlug === thesis.slug)}
                      >
                        {thesis.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

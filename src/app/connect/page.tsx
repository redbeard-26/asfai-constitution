const MCP_URL = "https://asfai.fenix.ai/api/mcp";

export const metadata = {
  title: "AI Connector — AI Constitution",
};

export default function ConnectPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">AI-native</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">AI Connector</h1>
      </div>
      <p className="mt-3 leading-relaxed text-ink">
        The AI Constitution is available to AI assistants through a{" "}
        <strong>Model Context Protocol (MCP)</strong> connector. Connect Claude (or
        any MCP-compatible client) so it can read the constitution and act on your
        behalf — voting, commenting, proposing edits, and submitting candidate
        theses.
      </p>

      <div className="mt-6 border border-panel-border bg-panel p-4">
        <p className="kicker text-xs">Connector URL</p>
        <code className="mt-1 block break-all font-mono text-sm text-ink">{MCP_URL}</code>
      </div>

      {/* Claude chat workflow */}
      <section className="mt-8">
        <div className="section-rule pt-3">
          <h2 className="kicker text-base">Connect in Claude</h2>
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink">
          <li>
            In Claude, open <strong>Settings</strong> (or <strong>Customize</strong>){" "}
            → <strong>Connectors</strong>.
          </li>
          <li>
            Click <strong>Add custom connector</strong>.
          </li>
          <li>
            Give it a name (e.g. <em>AI Constitution</em>) and paste the connector
            URL above into the <strong>URL</strong> field.
          </li>
          <li>
            Click <strong>Add</strong> / <strong>Connect</strong>. Claude will
            discover the available tools and you can start asking it to read or
            contribute to the constitution.
          </li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          Custom connectors require a paid Claude plan. Other MCP clients (Claude
          Code, Cursor, etc.) accept the same URL — see the project README.
        </p>
      </section>

      {/* Capabilities */}
      <section className="mt-8">
        <div className="section-rule pt-3">
          <h2 className="kicker text-base">What it can do</h2>
        </div>

        <h3 className="mt-4 font-bold text-ink">Read (open to anyone)</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
          <li>Read the constitution, any article, or any thesis (with vote score)</li>
          <li>List candidate theses (ordered by votes) and discussion comments</li>
          <li>
            Search the resource library and read any resource, including each link&apos;s{" "}
            <strong>stance</strong> (supports / challenges / discusses) and{" "}
            <strong>relevance</strong>
          </li>
        </ul>

        <h3 className="mt-4 font-bold text-ink">Act on your behalf (provide your email)</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
          <li>Vote up or down on theses and candidates</li>
          <li>Post discussion comments</li>
          <li>Propose edits (these enter the moderation queue — never auto-published)</li>
          <li>Submit candidate theses for community voting</li>
        </ul>

        <p className="mt-4 border-l-4 border-gold bg-panel px-4 py-3 text-sm text-ink">
          Actions are attributed to the email you provide. Reads need no identity.
          Proposed edits still require human moderator approval, and moderator
          actions (approving edits, promoting candidates, managing roles) are done
          on this site.
        </p>
      </section>
    </div>
  );
}

const MCP_URL = "https://asfai.fenix.ai/api/mcp";

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto border border-rule bg-panel p-3 font-mono text-xs leading-relaxed text-ink">
      {children}
    </pre>
  );
}

/**
 * AI Connector (MCP) instructions — the body of the collapsible "AI Connector"
 * section on the Resources page. The enclosing section supplies the heading.
 */
export function ConnectorGuide() {
  return (
    <div>
      <p className="leading-relaxed text-ink">
        The AI Constitution is available to AI assistants through a{" "}
        <strong>Model Context Protocol (MCP)</strong> connector over Streamable
        HTTP. Connect a client below so it can read the constitution and act on
        your behalf — voting, commenting, proposing edits, and submitting
        candidate theses.
      </p>

      <div className="mt-6 border border-panel-border bg-panel p-4">
        <p className="kicker text-xs">Connector URL</p>
        <code className="mt-1 block break-all font-mono text-sm text-ink">{MCP_URL}</code>
      </div>

      <div className="mt-8">
        <div className="section-rule pt-3">
          <h3 className="kicker text-base">Connect your client</h3>
        </div>

        <h4 className="mt-5 font-bold text-ink">Claude (web &amp; desktop)</h4>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
          <li>
            Open <strong>Settings</strong> (or <strong>Customize</strong>) →{" "}
            <strong>Connectors</strong>.
          </li>
          <li>
            Click <strong>Add custom connector</strong>.
          </li>
          <li>
            Name it <em>AI Constitution</em> and paste the connector URL into the{" "}
            <strong>URL</strong> field.
          </li>
          <li>
            Click <strong>Add</strong> / <strong>Connect</strong> — Claude
            discovers the tools automatically.
          </li>
        </ol>
        <p className="mt-1 text-xs text-muted">Custom connectors require a paid Claude plan.</p>

        <h4 className="mt-5 font-bold text-ink">Claude Code (CLI)</h4>
        <Code>{`claude mcp add --transport http ai-constitution ${MCP_URL}`}</Code>
        <p className="mt-1 text-xs text-muted">
          Add <code>-s user</code> to make it available in all your projects. Run{" "}
          <code>/mcp</code> in Claude Code to confirm.
        </p>

        <h4 className="mt-5 font-bold text-ink">Cursor</h4>
        <p className="mt-1 text-sm text-ink">
          Add to <code>~/.cursor/mcp.json</code> (global) or{" "}
          <code>.cursor/mcp.json</code> (per-project):
        </p>
        <Code>{`{
  "mcpServers": {
    "ai-constitution": { "url": "${MCP_URL}" }
  }
}`}</Code>

        <h4 className="mt-5 font-bold text-ink">VS Code (GitHub Copilot)</h4>
        <p className="mt-1 text-sm text-ink">
          Add to <code>.vscode/mcp.json</code>, then start it from the MCP view:
        </p>
        <Code>{`{
  "servers": {
    "ai-constitution": { "type": "http", "url": "${MCP_URL}" }
  }
}`}</Code>

        <h4 className="mt-5 font-bold text-ink">ChatGPT</h4>
        <p className="mt-1 text-sm text-ink">
          In <strong>Settings → Connectors</strong> (developer mode; availability
          depends on your plan), choose <strong>Create / Add custom connector</strong>,
          select <strong>MCP</strong>, and enter the connector URL.
        </p>

        <h4 className="mt-5 font-bold text-ink">Any other MCP client</h4>
        <p className="mt-1 text-sm text-ink">
          Point it at the URL as a <strong>Streamable HTTP</strong> server. Most
          clients accept this form:
        </p>
        <Code>{`{
  "mcpServers": {
    "ai-constitution": { "url": "${MCP_URL}" }
  }
}`}</Code>
      </div>

      <div className="mt-8">
        <div className="section-rule pt-3">
          <h3 className="kicker text-base">What it can do</h3>
        </div>

        <h4 className="mt-4 font-bold text-ink">Read (open to anyone)</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
          <li>Read the constitution, any article, or any thesis (with vote score)</li>
          <li>List candidate theses (ordered by votes) and discussion comments</li>
          <li>
            Search the resource library and read any resource, including each
            link&apos;s <strong>stance</strong> (supports / challenges / discusses)
            and <strong>relevance</strong>
          </li>
        </ul>

        <h4 className="mt-4 font-bold text-ink">Act on your behalf (provide your email)</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
          <li>Vote up or down on theses and candidates</li>
          <li>Post discussion comments</li>
          <li>Propose edits (these enter the moderation queue — never auto-published)</li>
          <li>Submit candidate theses for community voting</li>
        </ul>

        <p className="mt-4 border-l-4 border-gold bg-panel px-4 py-3 text-sm text-ink">
          Actions are attributed to the email you provide; reads need no identity.
          Proposed edits still require human moderator approval, and moderator
          actions (approving edits, promoting candidates, managing roles) are done
          on this site.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "MCP Server — Configure Solana Token-2022 with AI",
  description:
    "Install the Smeltr MCP server for Claude Desktop, Cursor, and other AI assistants. Validate Token-2022 transfer fees, soulbound tokens, and permanent delegate configs using Smeltr's real engine.",
  keywords: [
    "mcp server",
    "model context protocol",
    "solana token creation ai",
    "token-2022 ai assistant",
    "claude solana token",
    "cursor mcp solana",
    "deploy solana token ai",
  ],
  alternates: { canonical: `${SITE_URL}/docs/mcp` },
  openGraph: {
    url: `${SITE_URL}/docs/mcp`,
    title: "Smeltr MCP Server — Token-2022 for AI Assistants",
    description:
      "Read-only MCP tools: list modules, describe parameters, validate configs, estimate deployment cost.",
    images: [{ ...OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smeltr MCP Server — Token-2022 for AI Assistants",
    description: "Validate Solana Token-2022 configs in Claude Desktop and Cursor.",
    images: [OG_IMAGE.url],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Smeltr MCP Server",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Cross-platform",
  description:
    "Model Context Protocol server exposing Smeltr's Solana Token-2022 validation engine to AI assistants.",
  url: `${SITE_URL}/docs/mcp`,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "list_modules",
    "describe_module",
    "validate_config",
    "estimate_cost",
  ],
  publisher: {
    "@type": "Organization",
    name: "Smeltr Technologies LLC",
    url: SITE_URL,
  },
};

export default function McpDocsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">
            Model Context Protocol
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Smeltr MCP Server</h1>
          <p className="text-gray-600 leading-relaxed">
            Give AI assistants access to Smeltr&apos;s real Token-2022 validation engine.
            Read-only — no private keys, no RPC, no on-chain actions. Same logic as{" "}
            <Link href="/deploy" className="text-amber-700 underline">
              smeltr.org/deploy
            </Link>
            .
          </p>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Tools</h2>
          <dl className="space-y-3 text-sm">
            {[
              {
                name: "list_modules",
                desc: "All supported Token-2022 modules with descriptions and high-impact flags.",
              },
              {
                name: "describe_module",
                desc: "Parameter specs, valid ranges, authority fields, and security notes for one module.",
              },
              {
                name: "validate_config",
                desc: "Run the real compatibility engine + Zod schemas. Returns errors, warnings, and parameter issues.",
              },
              {
                name: "estimate_cost",
                desc: "Platform fee (0.03 SOL) plus estimated mint rent for a module selection.",
              },
            ].map(({ name, desc }) => (
              <div key={name} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <dt className="font-mono font-semibold text-amber-800">{name}</dt>
                <dd className="text-gray-600 mt-1">{desc}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Install (npm)</h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
            npx -y @smeltr/mcp-server
          </pre>
          <p className="text-xs text-gray-500 mt-2">
            Package:{" "}
            <a
              href="https://www.npmjs.com/package/@smeltr/mcp-server"
              className="text-amber-700 underline"
              rel="noreferrer"
              target="_blank"
            >
              @smeltr/mcp-server
            </a>{" "}
            on npm. Monorepo source:{" "}
            <a
              href="https://github.com/Space-Raven/Smeltr/tree/main/packages/mcp-server"
              className="text-amber-700 underline"
              rel="noreferrer"
              target="_blank"
            >
              packages/mcp-server
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Claude Desktop</h2>
          <p className="text-sm text-gray-600 mb-2">
            Add to <code className="text-xs bg-gray-100 px-1 rounded">claude_desktop_config.json</code>:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
            {`{
  "mcpServers": {
    "smeltr-token2022": {
      "command": "npx",
      "args": ["-y", "@smeltr/mcp-server"]
    }
  }
}`}
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Cursor</h2>
          <p className="text-sm text-gray-600 mb-2">
            Add to Cursor MCP settings (<code className="text-xs bg-gray-100 px-1 rounded">.cursor/mcp.json</code>{" "}
            or Settings → MCP):
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
            {`{
  "mcpServers": {
    "smeltr-token2022": {
      "command": "npx",
      "args": ["-y", "@smeltr/mcp-server"]
    }
  }
}`}
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">From source (monorepo)</h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
            npx tsx packages/mcp-server/src/server.ts
          </pre>
        </section>

        <section className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">Example prompt for your assistant</p>
          <p className="text-amber-800 italic">
            &quot;Use Smeltr to validate a Token-2022 config with 250 basis-point transfer fee,
            max fee 1M base units, and check compatibility if I also add non-transferable.&quot;
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Related</h2>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>
              <Link href="/modules/transfer-fee" className="text-amber-700 underline">
                Transfer Fee module
              </Link>
            </li>
            <li>
              <Link href="/blog/token-2022-module-configuration-reference" className="text-amber-700 underline">
                Token-2022 configuration reference
              </Link>
            </li>
            <li>
              <Link href="/trust" className="text-amber-700 underline">
                Trust Center — non-custodial guarantees
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}

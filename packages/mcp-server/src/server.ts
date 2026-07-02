/**
 * Smeltr MCP server (stdio).
 *
 * Exposes Smeltr's Token-2022 module configuration engine as MCP tools so AI
 * assistants can validate and explain token configs using the platform's real
 * logic. Read-only: no keys, no network, no on-chain actions.
 *
 * Run: `node dist/server.js` (or `tsx src/server.ts`). Register in an MCP
 * client (Claude Desktop, etc.) as a stdio server.
 *
 * Requires @modelcontextprotocol/sdk. The tool logic lives in ./tools and is
 * unit-tested independently of the SDK.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  listModules,
  describeModule,
  validateConfig,
  estimateCost,
  type ValidateInput,
} from "./tools";

const moduleSelectionShape = {
  modules: z
    .array(z.object({ id: z.string(), params: z.unknown().optional() }))
    .describe("The Token-2022 modules to configure, each with optional params."),
};

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "smeltr-token2022", version: "0.1.0" });

  server.tool(
    "list_modules",
    "List the Solana Token-2022 extension modules Smeltr supports (Transfer Fee, Non-Transferable, Permanent Delegate), with descriptions and high-impact flags.",
    {},
    async () => json(listModules())
  );

  server.tool(
    "describe_module",
    "Describe one Token-2022 module: its parameters, types, valid ranges, which fields are authorities, and security notes.",
    { id: z.string().describe("Module id, e.g. 'transfer-fee', 'permanent-delegate', 'non-transferable'.") },
    async ({ id }) => json(describeModule(id))
  );

  server.tool(
    "validate_config",
    "Validate a proposed Token-2022 module selection and parameters against Smeltr's real compatibility engine and each module's schema. Returns hard-conflict errors, soft-conflict warnings, and per-parameter validation issues.",
    moduleSelectionShape,
    async (args) => json(validateConfig(args as ValidateInput))
  );

  server.tool(
    "estimate_cost",
    "Estimate the SOL cost to deploy a Token-2022 token with the given modules: exact Smeltr platform fee plus an estimated rent range.",
    moduleSelectionShape,
    async (args) => json(estimateCost(args as ValidateInput))
  );

  return server;
}

async function main() {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}

// Only auto-start when run directly, not when imported by tests.
if (require.main === module) {
  main().catch((err) => {
    console.error("[smeltr-mcp] fatal:", err);
    process.exit(1);
  });
}

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

const tokenStandardSchema = z
  .enum(["token-2022", "spl-legacy"])
  .optional()
  .describe(
    'Solana mint program variant. Defaults to "token-2022". Use "spl-legacy" for Classic SPL (no extension modules).'
  );

const validateConfigShape = {
  tokenStandard: tokenStandardSchema,
  modules: z
    .array(z.object({ id: z.string(), params: z.unknown().optional() }))
    .describe(
      "Token-2022 extension modules to configure. Must be empty when tokenStandard is spl-legacy."
    ),
  decimals: z
    .number()
    .int()
    .min(0)
    .max(9)
    .optional()
    .describe("Mint decimals (0–9). Validated on the legacy path when provided."),
  mintAuthority: z
    .string()
    .optional()
    .describe("Base58 mint authority pubkey. Validated on the legacy path when provided."),
  freezeAuthority: z
    .string()
    .nullable()
    .optional()
    .describe("Base58 freeze authority pubkey, or null. Legacy path only when provided."),
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
    "Validate a proposed Solana token configuration against Smeltr's real engine. Token-2022: module compatibility + Zod schemas. Classic SPL (spl-legacy): mint-level fields only — modules are rejected.",
    validateConfigShape,
    async (args) => json(validateConfig(args as ValidateInput))
  );

  server.tool(
    "estimate_cost",
    "Estimate SOL cost to deploy: exact Smeltr platform fee (0.03 SOL) plus an estimated mint rent range. Pass tokenStandard spl-legacy for Classic SPL (no extension rent bump).",
    validateConfigShape,
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

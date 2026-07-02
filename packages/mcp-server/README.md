# @platform/mcp-server — Smeltr Token-2022 MCP server

An [MCP](https://modelcontextprotocol.io) server that exposes Smeltr's Solana
Token-2022 module-configuration engine to AI assistants. Every answer comes from
the platform's **real** validation code (`@platform/module-registry`), so an
assistant configuring a Token-2022 token gets the same result the deploy flow
would give.

Read-only. No private keys, no network, no on-chain actions.

## Tools

| Tool | Purpose |
|------|---------|
| `list_modules` | List supported modules (Transfer Fee, Non-Transferable, Permanent Delegate) with descriptions and high-impact flags. |
| `describe_module` | Parameters, types, valid ranges, authority fields, and security notes for one module. |
| `validate_config` | Validate a module selection + params against the real compatibility engine and each module's schema. Returns hard-conflict errors, soft-conflict warnings, and per-parameter issues. |
| `estimate_cost` | Exact platform fee + estimated rent range for a deployment. |

## Run

```bash
# from the repo root
npx tsx packages/mcp-server/src/server.ts
```

The server speaks MCP over stdio.

## Register in Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "smeltr-token2022": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-server/src/server.ts"],
      "cwd": "/absolute/path/to/Token-Platform-Merged"
    }
  }
}
```

Then ask, e.g., *"Validate a Token-2022 config with a 5% transfer fee and a
permanent delegate"* — the assistant will call `validate_config` and get
Smeltr's real verdict.

## Tests

```bash
npm run test:unit   # exercises the tool logic against the real module registry
```

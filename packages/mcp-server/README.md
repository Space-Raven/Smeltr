# @smeltr/mcp-server

[Model Context Protocol](https://modelcontextprotocol.io) server for **Solana Token-2022**
token configuration. Exposes Smeltr's real validation engine to AI assistants —
same logic as [smeltr.org/deploy](https://smeltr.org/deploy).

**Read-only.** No private keys, no RPC, no on-chain actions.

Documentation: **https://smeltr.org/docs/mcp**

## Install

```bash
npx -y @smeltr/mcp-server
```

## Tools

| Tool | Purpose |
|------|---------|
| `list_modules` | Supported modules (Transfer Fee, Non-Transferable, Permanent Delegate) with high-impact flags |
| `describe_module` | Parameters, ranges, authority fields, security notes |
| `validate_config` | Real compatibility engine + Zod schema validation. Optional `tokenStandard`: `"token-2022"` (default) or `"spl-legacy"` for Classic SPL mint-only validation |
| `estimate_cost` | Platform fee (0.03 SOL) + rent estimate. Pass `tokenStandard: "spl-legacy"` for Classic SPL (no extension rent bump) |

## Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "smeltr-token2022": {
      "command": "npx",
      "args": ["-y", "@smeltr/mcp-server"]
    }
  }
}
```

## Cursor

Add to `.cursor/mcp.json` or Cursor Settings → MCP:

```json
{
  "mcpServers": {
    "smeltr-token2022": {
      "command": "npx",
      "args": ["-y", "@smeltr/mcp-server"]
    }
  }
}
```

## From source (monorepo)

```bash
git clone https://github.com/Space-Raven/Smeltr.git
cd Smeltr
npm ci --legacy-peer-deps
npx tsx packages/mcp-server/src/server.ts
```

## Example prompt

> Use Smeltr to validate a Token-2022 config with 250 basis-point transfer fee
> and check compatibility with non-transferable.

Classic SPL (no extension modules):

> Use Smeltr with `tokenStandard: "spl-legacy"` to validate a Classic SPL mint config.

## Tests

From the repo root:

```bash
npm run test:mcp
npm run test:a3:unit
```

## License

MIT — Smeltr Technologies LLC

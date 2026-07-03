# MCP Registry — submission template

Use this when publishing via `mcp-publisher` (official registry) or opening a community listing PR.

---

## Official MCP Registry (recommended)

Follow `docs/MCP_LAUNCH.md` — no GitHub PR required. Uses `mcp-publisher publish`.

**Server manifest:** `packages/mcp-server/server.json`

---

## Community listing PR (modelcontextprotocol/servers)

If submitting to the community servers repo, use this PR body:

```markdown
## Server Information

- **Name:** Smeltr Token-2022
- **Registry ID:** `io.github.space-raven/smeltr-token2022`
- **npm:** `@smeltr/mcp-server`
- **Documentation:** https://smeltr.org/docs/mcp
- **Repository:** https://github.com/Space-Raven/Smeltr/tree/main/packages/mcp-server

## Description

Read-only MCP server for Solana Token-2022 token configuration. Exposes Smeltr's real
validation engine — the same logic as smeltr.org/deploy — to AI assistants.

**Tools:**
- `list_modules` — supported Token-2022 extension modules
- `describe_module` — parameter specs and authority field documentation
- `validate_config` — compatibility engine + Zod schema validation
- `estimate_cost` — platform fee and rent estimate

No private keys. No RPC. No on-chain actions.

## Install

### npm (recommended)

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

### From source

```bash
git clone https://github.com/Space-Raven/Smeltr.git
cd Smeltr && npm ci --legacy-peer-deps
npx tsx packages/mcp-server/src/server.ts
```

## Example use case

> "Validate a Token-2022 config with 250 basis-point transfer fee and check
> compatibility with non-transferable."

Returns real Smeltr compatibility errors/warnings before the user deploys on-chain.

## Checklist

- [x] Read-only (no write/mutation tools)
- [x] No API keys required
- [x] Open source (MIT)
- [x] Published npm package with `mcpName` field
- [x] Public documentation at smeltr.org/docs/mcp
```

---

## server.json entry (for reference)

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "io.github.space-raven/smeltr-token2022",
  "title": "Smeltr Token-2022",
  "description": "Validate Solana Token-2022 module configs with Smeltr's real engine.",
  "version": "0.1.0",
  "websiteUrl": "https://smeltr.org/docs/mcp",
  "repository": {
    "url": "https://github.com/Space-Raven/Smeltr",
    "source": "github",
    "subfolder": "packages/mcp-server"
  },
  "packages": [{
    "registryType": "npm",
    "identifier": "@smeltr/mcp-server",
    "version": "0.1.0",
    "transport": { "type": "stdio" }
  }]
}
```

---

## After publishing

1. Verify: `curl "https://registry.modelcontextprotocol.io/v0/servers?search=smeltr"`
2. Update `docs/MCP_LAUNCH.md` checklist
3. Post on X with install snippet + link to `/docs/mcp`
4. Add badge to README: `[MCP Registry](https://registry.modelcontextprotocol.io/...)`

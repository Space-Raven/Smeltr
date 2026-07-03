# MCP Launch Guide — Smeltr Token-2022

**Goal:** Make Smeltr discoverable when agents are asked about Solana token creation.

**Docs:** https://smeltr.org/docs/mcp  
**npm package:** `@smeltr/mcp-server`  
**Registry name:** `io.github.space-raven/smeltr-token2022`

---

## Pre-flight checklist

- [ ] Changes merged to `main` and deployed to Vercel
- [ ] `https://smeltr.org/docs/mcp` loads (crawlable in coming-soon mode)
- [ ] `https://smeltr.org/sitemap.xml` includes `/docs/mcp` and `/modules/*`
- [ ] `https://smeltr.org/llms.txt` lists MCP tools and npm install command
- [ ] `@smeltr` npm org exists and you have publish access

---

## Step 1 — Publish to npm

From the repo root:

```bash
cd packages/mcp-server
npm run build          # esbuild → dist/server.js (~1.6MB bundled)
npm login              # use account with @smeltr org access
npm publish --access public
```

Verify:

```bash
npx -y @smeltr/mcp-server --help 2>&1 | head
# Or test in Claude Desktop / Cursor with the config below
```

### Claude Desktop / Cursor config

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

---

## Step 2 — Publish to the official MCP Registry

Uses the [MCP Registry](https://modelcontextprotocol.io/registry/quickstart) and `mcp-publisher` CLI.

### Install CLI (macOS/Linux)

```bash
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" \
  | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/
```

Windows: download the latest release binary from  
https://github.com/modelcontextprotocol/registry/releases

### Authenticate (GitHub namespace)

```bash
cd packages/mcp-server
mcp-publisher login github
```

You must have push access to `Space-Raven/Smeltr` — the namespace `io.github.space-raven/*` is verified via GitHub OAuth.

### Validate and publish

```bash
mcp-publisher validate server.json
mcp-publisher publish server.json
```

**Ownership proof:** `package.json` includes:

```json
"mcpName": "io.github.space-raven/smeltr-token2022"
```

This must match `server.json` → `name` exactly. npm package `@smeltr/mcp-server` must be published **before** registry publish (registry verifies npm ownership via `mcpName` linkage).

### Verify listing

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?search=smeltr"
```

---

## Step 3 — Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://smeltr.org` (or `https://www.smeltr.org` — pick canonical domain)
3. Verify via DNS TXT record (Vercel domain settings) or HTML file upload
4. Submit sitemap: `https://smeltr.org/sitemap.xml`
5. Request indexing for high-priority URLs:
   - `/docs/mcp`
   - `/modules/transfer-fee`
   - `/blog/token-2022-module-configuration-reference`

**Note:** While `SITE_MODE=coming-soon`, sitemap intentionally omits `/` and `/deploy`. Content/MCP pages are still indexed.

---

## Step 4 — Agent discoverability (manual, high ROI)

| Action | Where |
|--------|-------|
| Install MCP in your own Cursor + Claude | Screenshot for social proof |
| Post install snippet + link to `/docs/mcp` | X @Smeltr_App |
| Add MCP section to GitHub README | `Space-Raven/Smeltr` |
| Reply to Solana/token questions with MCP hint | Reddit, Discord |

### Example social post

> Building a Solana token with transfer fees?  
> Smeltr MCP gives Claude/Cursor Smeltr's real Token-2022 validation engine — no keys, no RPC.  
> `npx -y @smeltr/mcp-server`  
> Docs: https://smeltr.org/docs/mcp

---

## Step 5 — Post-launch verification

```bash
# Web
curl -sI https://smeltr.org/docs/mcp | head -1
curl -s https://smeltr.org/llms.txt | grep -i mcp

# npm
npm view @smeltr/mcp-server version

# Registry
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=smeltr" | jq .
```

### Smoke-test MCP tools

Ask your assistant:

> Use Smeltr MCP to list modules, then validate a config with transfer-fee at 500 basis points and non-transferable together.

Expected: soft-conflict warning (fees never collectible on non-transferable tokens).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npx @smeltr/mcp-server` not found | npm publish not done or wrong org scope |
| Registry rejects publish | `mcpName` mismatch; npm package not published first |
| MCP tools return errors | Node ≥20 required; check `npx -y @smeltr/mcp-server` runs without wallet |
| `/docs/mcp` 404 | Deploy not merged; check Vercel build logs |
| Google not indexing MCP page | Submit URL in Search Console; confirm `/docs` in middleware PUBLIC_PATHS |

---

## Files reference

| File | Purpose |
|------|---------|
| `packages/mcp-server/server.json` | MCP Registry manifest |
| `packages/mcp-server/package.json` | npm + `mcpName` for registry verification |
| `apps/web/app/docs/mcp/page.tsx` | Public install docs |
| `apps/web/public/llms.txt` | AI crawler discovery |
| `apps/web/app/sitemap.ts` | Dynamic sitemap (SITE_MODE-aware) |
| `docs/MCP_REGISTRY_PR.md` | Copy-paste PR body if submitting to community lists |

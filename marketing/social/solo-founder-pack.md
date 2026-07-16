# Solo founder social pack — viral v2

**Review pipeline:** copywriter → social manager → viral polish (all 8+/10)  
**Handle:** @Smeltr_App  
**Deploy:** https://smeltr.org/deploy  
**MCP:** https://smeltr.org/docs/mcp  
**GitHub:** https://github.com/Space-Raven/Smeltr  

Loop agent: read this file + `posting-log.md`, deliver the next unposted item, log it.

**Assets** (`brand/mock/`): `profile-square.png`, `banner-social-1500x500.png`, `coin-brass-512.png`  
**Screenshots:** deploy review panel, module picker with warning visible, `/docs/mcp` page

**Posting order:** x-1 → x-4 → x-2 (thread) → x-3 → Reddit r/solana → Reddit r/solanadev (48h later)

---

## X Post 1 — Non-custodial guard (8.5/10)

**Post:**
```
"Non-custodial" on most token launchers = a Terms of Service line.

On Smeltr = the builder throws if our address lands in your authority slots.

Your wallet signs everything. We never touch mint authority.

Which launcher did you actually audit?

→ smeltr.org/deploy
```

**Reply (pin if it hits):**
```
assertNoPlatformAuthority() — checked before every instruction build.

Throws if any platform address appears in an authority slot.

Not policy. Source you can grep.
```

**Visual:** Deploy review panel — authority fields showing user wallet (not brass coin alone).

---

## X Post 2 — Metadata trap thread (8/10)

**Tweet 1/3:**
```
Most Token-2022 launches don't fail on the logo.

They fail on tx 2 — metadata attachment — because the mint was sized wrong on tx 1.

Have you ever hit this? What did the RPC say?
```

**Tweet 2/3:**
```
The trap (still common):

• createReallocateInstruction in tx 2
• Extra lamport transfer
• InitializeTokenMetadata on an underfunded account

Looks fine in the UI. Dies at sign.
```

**Tweet 3/3:**
```
The fix:

• Overfund CreateAccount in tx 1 for the TokenMetadata TLV
• Tx 2 = InitializeTokenMetadata only

Same two signatures. No reallocate. No surprise rent.

→ smeltr.org/deploy
```

**Visual:** `brand/mock/metadata-tx-diagram-1600.png` (wrong vs correct 2-panel) or deploy review panel showing two-step flow.

---

## X Post 3 — MCP validation (8.5/10)

**Post:**
```
Your AI assistant shouldn't guess whether transfer-fee + soulbound collides.

Smeltr MCP validates Token-2022 configs read-only.

No keys. No RPC. No deploy.

Cursor · Claude Desktop · any MCP client.

Reply "mcp" and I'll paste the one-liner.
```

**Reply (post immediately after, or when someone says "mcp"):**
```
npx -y @smeltr/mcp-server

Docs → smeltr.org/docs/mcp
```

**Optional Pjorg reply (deadpan):**
```
Workshop note: Pjorg is a tortoiseshell cat with zero signing permissions.
```

**Visual:** `/docs/mcp` screenshot with install command + tool list visible.

---

## X Post 4 — Soft conflict + Pjorg (8.5/10)

**Post:**
```
You can deploy a soulbound token with transfer fees on Solana.

You just can't ever collect those fees.

Smeltr flags it before you sign — not after you're live on mainnet.

→ smeltr.org/deploy
```

**Reply bait (self-reply ~10 min later):**
```
What's the most cursed Token-2022 combo you've seen ship to mainnet?
```

**Optional Pjorg alt hook** (swap first line if using warning screenshot):
```
Non-transferable + transfer fee is legal on-chain.

Pjorg flagged this combo. Then she went back to sleep.

Smeltr still warns you before you sign.
```

**Visual:** Module picker with **compatibility warning banner fully visible** (crop tight on warning text).

---

## Reddit — r/solana (short, 8/10)

**Title:** I built a non-custodial Token-2022 launcher — your mint authority never leaves your wallet

**Body:**
```
Hey r/solana,

Smeltr (https://smeltr.org) deploys Token-2022 tokens with real extensions — no code, two wallet signatures:

• Transfer Fee — basis-point fee on transfers, configurable cap
• Non-Transferable — soul-bound (credentials, loyalty, achievements)
• Permanent Delegate — authority over all token accounts

**Why I built it:** Most launchers say "non-custodial" in the ToS. Smeltr has `assertNoPlatformAuthority()` in source — it throws if any platform address appears in an authority slot. Your wallet signs everything. We never hold mint authority.

**What trips people up:** extension combos and metadata sizing. Smeltr checks compatibility and warns before you sign (e.g. Non-Transferable + Transfer Fee is legal but fees can never be collected).

No account required. Sign-in is optional — just unlocks deployment history.

Happy to answer Token-2022 questions. Link: https://smeltr.org
```

**Visual:** `brand/mock/banner-social-1500x500.png`

**Cooldown:** Max once per 30 days per subreddit. Check `posting-log.md`.

---

## Reddit — r/solanadev (long, 8/10)

**Title:** Token-2022 tx-builder with composable extension modules — looking for technical feedback

**Body:**
```
Hey r/solanadev,

Sharing Smeltr — a Token-2022 deployment platform built around two pure TypeScript packages (no Anchor):

**module-registry**
• Each module (Transfer Fee, Non-Transferable, Permanent Delegate) = Zod schema + builder
• `assertNoPlatformAuthority()` before every instruction — throws if platform address hits an authority slot
• `validateModuleSelection()` — duplicate ExtensionTypes, hard conflicts, soft warnings (Non-Transferable + Transfer Fee: legal, fees uncollectable)

**tx-builder — instruction order:**
1. `CreateAccount` — space from `getMintLen`, lamports overfunded for TokenMetadata TLV
2. Module pre-init instructions
3. `InitializeMetadataPointer`
4. `InitializeMint`

Metadata attachment (separate tx by design):
• `InitializeTokenMetadata` only — no reallocate, no extra lamport transfer

**MCP:** `npx -y @smeltr/mcp-server` — read-only config validation for Cursor/Claude. No keys, no RPC.

**Want feedback on:**
• Extension compatibility matrix — what else should be flagged?
• Module params / UX before sign
• MCP tool surface — missing anything you'd want an agent to check pre-deploy?

Source: https://github.com/Space-Raven/Smeltr
Deploy: https://smeltr.org/deploy
MCP: https://smeltr.org/docs/mcp
```

**Visual:** Module picker warning screenshot

**Cooldown:** 48h after r/solana post. Check `posting-log.md`.

---

## Pjorg rules (social only)

- **DO:** Deadpan one-liners, forge cat, "zero signing permissions"
- **DON'T:** Full PJORG lore, War-Juice, Oslo Fire Schism, etc.
- **Best on:** x-4 alt hook or x-3 reply only

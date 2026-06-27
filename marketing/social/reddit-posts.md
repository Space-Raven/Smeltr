# Smeltr — Reddit Launch Posts

---

## r/solana — Launch Post

**Title:**
I built a non-custodial Token-2022 launcher — no code, two wallet clicks, your mint authority never leaves your wallet

**Body:**

Hey r/solana,

I've been working on something for the past few months and it's finally ready to share publicly.

**What it does:**
Smeltr (smeltr.app) lets you deploy Solana Token-2022 tokens with real extension support — without writing any code.

The supported extensions right now:
- **Transfer Fee** — collect a basis-point percentage on every token transfer, with a configurable max cap
- **Non-Transferable** — soul-bound tokens that stay with the original holder forever (great for credentials, loyalty tiers, game achievements)
- **Permanent Delegate** — designate an authority over all token accounts for the mint

It handles the part that trips people up: correct instruction ordering, account size calculation, extension compatibility checking, and the two-transaction metadata pattern.

**The non-custodial bit (this matters):**
There's a runtime guard in the source code (`assertNoPlatformAuthority`) that throws an exception if any platform-owned address appears in an authority field of any transaction it builds. Not a terms of service. An actual thrown exception.

I got tired of token launchers that quietly hold mint authority or require you to send SOL to a platform wallet before your token is "released." That model is structurally broken and Smeltr is designed so it can't do that even if someone wanted it to.

**What it won't do:**
- Hold your funds
- Add platform addresses to your token
- Require you to create an account (sign-in is optional and only unlocks the deployment history dashboard)

**The technical stuff (for the devs here):**
The interesting parts are the `packages/tx-builder` and `packages/module-registry` packages — pure TypeScript, no Anchor dependency. The tx-builder produces the exact instruction set Token-2022 requires in the exact order it requires them. The module registry wraps extension configurations in Zod schemas and validates combinations.

Happy to answer any questions — token deployment mechanics, Token-2022 extension specifics, the non-custodial architecture, whatever.

**Link:** smeltr.app

---

## r/solanadev — Launch Post

**Title:**
Built a Token-2022 tx-builder with composable extension modules — open to technical feedback

**Body:**

Hey r/solanadev,

Sharing a project I've been building: Smeltr, a Token-2022 deployment platform with a module system for extensions.

**The technical architecture (what I think will interest people here):**

The core is two pure TypeScript packages:

`@platform/module-registry` — defines modules (Transfer Fee, Non-Transferable, Permanent Delegate), each with a Zod schema for params and a builder function. Key pieces:
- `assertNoPlatformAuthority()` — checked before every instruction build. Throws if any platform address appears in an authority slot. This is the non-custodial invariant.
- `U64StringSchema` — params like `maximumFee` are numeric strings → BigInt to avoid JS precision loss on u64 values
- `validateModuleSelection()` — checks for duplicate ExtensionTypes, hard incompatibilities, and soft conflicts (e.g., Non-Transferable + Transfer Fee: legal but fees can never be collected)

`@platform/tx-builder` — orchestrates the instruction sequence:
1. `SystemProgram.createAccount` — space = `getMintLen([...moduleExtensions, MetadataPointer])`, lamports = rent for `(space + additionalMintSpace)` (overfunded to cover the TokenMetadata TLV entry)
2. Module pre-init instructions
3. `InitializeMetadataPointer`
4. `Token2022.initializeMint`

Then separately: `buildMetadataAttachmentInstructions` → just `createInitializeInstruction`. No reallocate, no extra lamport transfer — the overfunding in step 1 covers it.

**What I'm unsure about / want feedback on:**
- The Irys upload path — method names (getPrice, getBalance, fund, uploadData) reflect Bundlr-era naming. Haven't verified against the current @irys/web-upload package. Anyone used this recently?
- Extension compatibility matrix — currently only have Transfer Fee + Non-Transferable as a soft conflict. What other combinations should I be flagging?
- Transaction size guard — currently just checks against 1232 bytes. Is there a better heuristic for when a complex module combination might approach the limit?

Source is at github.com/smeltrapp if you want to look at the actual implementation.

Frontend is at smeltr.app — but the packages are the interesting part.

---

## r/solana — Follow-up Post (T+7 days)

**Title:**
One week after launching my Token-2022 launcher — what I learned

**Body:**

A week ago I posted about Smeltr here. Quick update for anyone who's interested in how a Solana dev tool launch goes.

**What happened:**
- [X] tokens deployed in the first week
- Most common feedback: people didn't know you couldn't combine Non-Transferable with Transfer Fee (they conflict — Smeltr surfaces this as a warning, not an error, because it's technically legal but the fees can never be collected)
- Second most common: "I didn't know metadata was a separate transaction" — this is a Token-2022 thing, not a Smeltr thing, but apparently it surprises people

**What I got wrong in the launch:**
- Didn't have the blog posts ready on day one. A few people googled "token-2022 transfer fee tutorial" and found competitors instead. Fixed — three posts going up this week.
- The "fund your Irys uploader" step still creates friction for new users. Working on the premium tier to solve this.

**What's coming:**
- Analytics dashboard for Transfer Fee tracking (see your unharvested balance, harvest in one click)
- Subscription tier for platform-funded uploads
- Devnet test suite fully green

Still happy to answer Token-2022 questions — that seems to be where I can add the most value in this community.

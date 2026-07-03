# Smeltr — Twitter / X Content Pack
> All posts are copy-paste ready. Replace [DATE], [STATS], [LINK] placeholders before posting.
> Handle: @smeltrapp

---

## 🚀 LAUNCH THREAD (T=0, post as a thread)

**Tweet 1 — Hook**
Spent months building something I needed but couldn't find:

A Solana Token-2022 launcher that's actually non-custodial.

No mint authority games. No custody. No surprise fees.

Your keys. Your token. Two wallet signatures.

Introducing Smeltr 🌿

🧵

---

**Tweet 2 — The problem**
Most Solana token launchers have a quiet problem:

They hold your mint authority.

That means THEY control:
→ Who can mint new tokens
→ Whether your token survives if they shut down
→ Whether your token is "theirs" before it's yours

Smeltr has a runtime guard in the source code that throws an exception if ANY platform address appears in an authority slot.

Not a policy. An exception.

---

**Tweet 3 — What it does**
Smeltr lets you deploy Token-2022 tokens with real extensions — without writing a line of code:

🔵 Transfer Fee — collect basis-point royalties on every transfer
⚪ Non-Transferable — soul-bind tokens to a single wallet forever
🔴 Permanent Delegate — designate an authority over all token accounts

Compatibility checked. Instruction order validated. Rent calculated.

You just sign.

---

**Tweet 4 — How it works**
The deploy flow:

1. Pick your Token-2022 extension modules
2. Upload a name, symbol, image → stored on Arweave via Irys
3. Review the plan (rent cost, warnings, acknowledgements)
4. Sign tx 1 → mint created
5. Sign tx 2 → metadata attached

That's it. No account required. No email. Just a wallet.

[LINK]

---

**Tweet 5 — The technical bit (for devs)**
The part I'm most proud of:

Smeltr gets the Token-2022 account sizing right.

Most launchers either:
• Don't support Token-2022 metadata at all, or
• Use createReallocateInstruction (wrong), or
• Fail silently on metadata attachment

Smeltr overfunds the account in tx 1 to cover the TokenMetadata TLV entry.
Tx 2 just calls InitializeTokenMetadata. No reallocate. No extra lamport transfer.

This is the documented Solana pattern. We implemented it correctly.

---

**Tweet 6 — Non-Transferable use cases**
Quick thread within a thread: what are non-transferable tokens actually for?

• Conference attendance credentials
• Loyalty tier status (can't be bought — must be earned)
• Course completion certificates
• DAO membership that can't be transferred to a sockpuppet
• Game achievements that stay with the player

Soul-bound tokens are underused. Smeltr makes them a checkbox.

---

**Tweet 7 — Transfer Fee mechanics**
Transfer fees on Token-2022 work differently than you might expect.

The fee isn't taken immediately. It's WITHHELD in the recipient's token account.

Then periodically:
1. `harvestWithheldTokensToMint` → sweeps fees from all recipient accounts to mint
2. `withdrawWithheldTokensFromMint` → moves them to your wallet

Smeltr's analytics dashboard (coming) will show you your unharvested balance and let you collect it in one click.

---

**Tweet 8 — CTA**
If you're building on Solana and need a token:

→ smeltr.org — deploy in 5 minutes, no code, no custody

If you're a dev and want to see how the transaction builder works:

→ github.com/smeltrapp — the tx-builder and module-registry packages are the interesting bits

Feedback welcome. This is v0.1. 🌿

---

**Tweet 9 — Repost hook (post 24h later)**
Yesterday I launched Smeltr.

In the first 24 hours:
• [X] token deployments
• [Y] unique wallets
• [Z] transfers tested

Most common feedback: "I didn't know you could combine transfer fees with soul-bound tokens" (you can't — they conflict, and Smeltr tells you why before you sign anything)

---

**Tweet 10 — Closing / pin tweet**
@smeltrapp is live.

Non-custodial Token-2022 launcher for Solana.

✅ Transfer fees
✅ Soul-bound (non-transferable)
✅ Permanent delegate
✅ Arweave metadata
✅ No account required
✅ Your mint authority from block 0

[LINK]

---

## 📅 EVERGREEN TWEETS (post 1-2x per week post-launch)

**Evergreen 1 — Education**
Token-2022 fact:

Once you call `InitializeMint`, your extension configuration is permanent.

You can't add or remove extensions later.

That's why Smeltr validates compatibility BEFORE you sign anything — not after.

---

**Evergreen 2 — Comparison**
The difference between Smeltr and a custodial token launcher:

Custodial: They build the tx, sign it, submit it, hand you the token.
Smeltr: We build the tx, YOU sign it, YOU submit it. We never touch it.

The mint authority is in your wallet from the moment `initializeMint` lands on-chain.

---

**Evergreen 3 — Use case hook**
If you're building a web3 loyalty programme:

Non-Transferable tokens on Solana are perfect for tier status.

Bronze/Silver/Gold tiers that:
- Can't be bought or sold
- Can only be earned through the programme
- Live in the holder's wallet forever

Deploy one in 3 minutes at smeltr.org 🌿

---

**Evergreen 4 — Reply bait**
What are you building on Solana that needs a token?

Game currency? Governance token? Creator royalty token? Loyalty credential?

Reply below — happy to suggest which Token-2022 extensions make sense for your use case.

---

**Evergreen 5 — Stats / social proof (fill in after launch)**
Since launch:

🌿 [X] tokens deployed
💸 [Y] SOL in transfer fees configured
🔒 [Z] soul-bound credentials minted
🔑 [W] permanent delegates set

All non-custodial. All Token-2022.

[LINK]

---

## 🎯 REPLY TEMPLATES (for common questions in the wild)

**When someone asks "how do I add transfer fees to my Solana token?"**
> Hey! You can do this with the Token-2022 TransferFeeConfig extension. If you want a no-code option, Smeltr (smeltr.org) lets you configure transfer fees, set a max cap, and deploy in two wallet clicks. Happy to explain the manual SDK approach too if you're going code-first.

**When someone asks "what's the difference between Token and Token-2022?"**
> Token-2022 is Solana's extended token standard — same foundation as SPL Token but with optional extensions you configure at mint creation (transfer fees, soul-bound restrictions, permanent delegates, etc). You can't add extensions after the fact, so choosing them upfront matters. We built Smeltr to make that choice easier: smeltr.org

**When someone warns about a custodial launcher**
> This is a real concern. Most launchers hold your mint authority between the time they build the transaction and when you receive the token — and some never fully relinquish it. Smeltr's source code has a runtime guard (`assertNoPlatformAuthority`) that throws if any platform address appears in an authority slot. Worth checking that for any launcher you use.

**When someone shares a failed Token-2022 deployment**
> This is usually an instruction ordering issue — Token-2022 extensions must be initialised before `InitializeMint`, and they need to be in the same transaction as `CreateAccount`. Also common: incorrect account sizing that causes metadata attachment to fail. What error are you seeing?

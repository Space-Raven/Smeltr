# Smeltr — Newsletter Pitch Templates

Send these individually, personalised per newsletter. Never mass-send the same text.

---

## Target Newsletters

1. **Helius Dispatch** — helius.xyz/blog (Solana dev audience, ~20k)
2. **SolanaFM Newsletter** — solana.fm (explorer users, dev-heavy)
3. **The Solana Daily** — thesolanadaily.com
4. **Bankless** — bankless.com (general web3, broad reach)
5. **PoW** (Proof of Work Newsletter) — dev/builder focused

---

## Pitch Template A — Developer-Focused (Helius, SolanaFM)

**Subject:** Tool launch: non-custodial Token-2022 launcher with extension modules

Hey [NAME],

Big fan of [NEWSLETTER] — the [SPECIFIC RECENT PIECE] was particularly useful.

I launched Smeltr this week (smeltr.app) — a no-code Token-2022 token launcher that I think your developer audience would find interesting, specifically because of how it handles the non-custodial guarantee.

Most launchers either don't support Token-2022 extensions or hold mint authority in some quiet way. Smeltr has a runtime guard in the codebase (`assertNoPlatformAuthority`) that throws an exception if a platform address appears in any token authority slot — it's verifiable in the source, not just a policy claim.

The technical parts that might be worth a mention:
- Correct two-transaction metadata pattern (overfunds tx 1, no reallocate in tx 2)
- Composable extension modules with Zod-validated schemas and compatibility checking
- Transfer Fee + Non-Transferable + Permanent Delegate support

Happy to provide a draft blurb, screenshots, or a quick demo call if useful.

Thanks,
[YOUR NAME]
smeltr.app | @smeltrapp

---

## Pitch Template B — General Web3 (Bankless, broader)

**Subject:** Smeltr — deploy Solana tokens without surrendering mint authority

Hey [NAME],

I recently launched Smeltr (smeltr.app) — a non-custodial Solana Token-2022 launcher and thought it might be relevant for [NEWSLETTER] readers.

The core idea: most token launchers quietly hold your mint authority. Smeltr's source code has a hard guard that prevents this — it's not a policy, it's a thrown exception in the codebase.

For your readers who are building or investing in Solana projects, this matters: if the platform you used to launch your token ever acted maliciously or shut down, and they held your mint authority, you've lost control of your token. Smeltr is designed so that can't happen.

Two wallet signatures to deploy. No account. No custody.

If you'd like to cover it, I can provide a writeup, a demo, or any other assets. Would also be happy to write a guest piece on "what Token-2022 extensions actually are and why they matter."

Thanks,
[YOUR NAME]

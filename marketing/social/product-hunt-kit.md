# Smeltr — Product Hunt Launch Kit

## Submission Details

**Name:** Smeltr

**Tagline:**
The non-custodial Token-2022 launcher for Solana

**Topics:** Developer Tools, Web3, Blockchain, Open Source, Productivity

**Website:** https://smeltr.org

**Profile photo:** `apps/web/public/profile-photo.png` — master: `brand/source/mark.svg` (see `brand/README.md`)

Regenerate: `cd apps/web && npm run brand:export`

---

## Description (500 chars max)

Deploy Solana Token-2022 tokens without writing code — and without surrendering your mint authority.

Pick from composable extension modules (transfer fees, soul-bound locks, permanent delegate), upload metadata to Arweave, and sign with your wallet — mint creation plus optional metadata attachment.

No account needed. No custody. Your mint authority is yours from block one.

Built on Solana's native Token-2022 program — no third-party smart contracts. Includes an MCP server for AI-assisted config validation.

---

## Maker's First Comment (post immediately at launch — this is critical)

Hey Product Hunt! 👋 I'm [NAME], the builder behind Smeltr.

**Why I built this:**
I kept running into the same problem deploying Token-2022 tokens for projects: either I was writing the same boilerplate transaction construction code from scratch, or I was using a launcher that held my mint authority in some opaque way I couldn't verify.

Smeltr solves both. It handles the transaction construction — correct instruction ordering, compatibility validation, rent calculation — and the source code literally throws an exception if any platform address appears in a token authority slot. Not a terms of service. An exception.

**What makes it different from other launchers:**
1. **Actually non-custodial** — verified at the code level, not just the policy level
2. **Token-2022 extension support** — transfer fees, non-transferable (soul-bound), permanent delegate — with compatibility checking between them
3. **Correct metadata pattern** — we overfund the account in transaction 1 to cover the TokenMetadata TLV. Most third-party implementations get this wrong and require a separate reallocate transaction (or just fail)
4. **No account required** — connect your wallet, deploy, disconnect. Done.

**Who it's for:**
- Solana developers who are tired of writing the same deployment boilerplate
- Founders who want to launch a token without hiring a Solana dev
- Anyone deploying a loyalty credential, game currency, or creator royalty token who wants Token-2022 extension features

Happy to answer any questions about the technical implementation, the non-custodial architecture, or Token-2022 in general. I've been deep in the Solana docs for months on this — ask me anything.

---

## Gallery Image Captions (5 images recommended)

1. `profile-photo.png` — **Profile / avatar (icon mark)**
2. `og-image.png` — **Hero: Deploy Token-2022 tokens without writing code**
3. Deploy flow screenshot — **Compose modules → validate → review → sign**
3. Module picker screenshot — **Pick your extensions. Compatibility checked instantly.**
4. Review panel screenshot — **See exactly what you're signing before you sign it.**
5. Dashboard screenshot — **Track every deployment. Resume metadata attachment anytime.**

---

## Launch Day Checklist

- [ ] Schedule for Tuesday at 12:01am PT (Product Hunt resets at midnight)
- [ ] Line up 20+ upvotes from friends/community BEFORE launch (tell them to visit the URL, not just click from your message)
- [ ] Post launch tweet the moment it goes live — link to PH page
- [ ] Post in Solana Discord servers with the PH link
- [ ] Maker responds to EVERY comment within 30 minutes on launch day
- [ ] Have the "Day 1 stats" tweet ready to post at 6pm PT
- [ ] Thank top upvoters publicly on Twitter

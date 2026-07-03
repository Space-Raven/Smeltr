# Smeltr — Discord Server Kit

## Server Setup

**Server Name:** Smeltr
**Server Icon:** Use logo-mark.svg
**Server Banner:** Use og-image.svg (cropped to 960×540)
**Verification Level:** Medium (must have verified email)
**Default Notifications:** Only @mentions

---

## Channel Structure

### 📢 INFORMATION
- `#announcements` — Slow mode 1hr. Admin-only. Product updates and changelog.
- `#roadmap` — Pinned roadmap post. Thread-only replies.
- `#start-here` — Rules, links, and onboarding pinned message (see below).

### 💬 COMMUNITY
- `#general` — Open chat.
- `#introductions` — Tell us what you're building.
- `#showcase` — Share tokens you've deployed with Smeltr. Include mint address.

### 🛠 SUPPORT
- `#deploy-help` — Token deployment questions. **Answer every post within 4 hours.**
- `#feedback` — Bug reports and feature requests.
- `#token-2022-deep-dive` — Technical discussion of Token-2022 extensions, Solana mechanics, RPC, etc.

### 🤝 ECOSYSTEM
- `#collab` — Cross-project collaboration and integration requests.
- `#jobs` — Solana/web3 roles. Project-relevant only.

---

## #start-here Pinned Message

```
👋 Welcome to the Smeltr server!

Smeltr is a non-custodial Token-2022 launcher for Solana.
Deploy transfer fee tokens, soul-bound credentials, and permanent delegate tokens — no code, two wallet clicks.

🔗 App: https://smeltr.org
📖 Blog: https://smeltr.org/blog
🐦 Twitter: https://twitter.com/smeltrapp

**Quick rules:**
1. Be excellent to each other.
2. Token deployment questions → #deploy-help (we respond fast)
3. Bug reports → #feedback (include your browser + wallet)
4. No unsolicited project promotion outside #collab and #showcase
5. No financial advice. No price speculation. We're infrastructure, not a trading forum.

If you deployed a token with Smeltr, share it in #showcase — we'd love to see what you're building 🌿
```

---

## #announcements — Launch Day Post

```
🚀 **Smeltr is live**

Deploy Solana Token-2022 tokens without writing code — and without surrendering your mint authority.

**What you can deploy today:**
🔵 Transfer Fee tokens — collect basis-point royalties on every transfer
⚪ Non-Transferable tokens — soul-bound credentials that stay with their holder
🔴 Permanent Delegate tokens — designate an authority over all token accounts

**What makes Smeltr different:**
- Genuinely non-custodial: there's a runtime guard in the source code that throws if any platform address appears in a token authority slot
- Correct Token-2022 metadata pattern (most launchers get this wrong)
- No account required — connect wallet, deploy, disconnect

→ **https://smeltr.org**

Questions? Ask in #deploy-help. Feedback in #feedback. Show us what you build in #showcase 🌿
```

---

## Ecosystem Server Outreach Messages

**For Solana Tech / Foundation Discord:**
```
Hey — I recently launched Smeltr (smeltr.org), a non-custodial Token-2022 launcher. 
It handles transfer fees, non-transferable, and permanent delegate extensions with 
compatibility validation and correct instruction ordering. Happy to answer any 
Token-2022 questions here or help troubleshoot deployments. Just dropping in!
```

**For Helius Discord:**
```
Hi all — launched a Token-2022 deployment platform this week called Smeltr (smeltr.org).
Uses Helius-compatible RPC, built on @solana/spl-token 0.4.x. If anyone's working 
on Token-2022 extension tooling or has questions about extension config, happy to chat.
```

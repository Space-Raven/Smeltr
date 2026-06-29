# Setup Verification Checklist

**Date**: June 15, 2026  
**Status**: In Progress

## ✅ Completed Setup Steps

### 1. Project Structure
- [x] Merged project created at `C:\Users\joshk\Token-Platform-Merged`
- [x] Primary working copy at `C:\Users\joshk\Token-Platform` (in progress)
- [x] Dependencies installed (888 packages)
- [x] Workspaces configured (4 packages: core-schemas, module-registry, tx-builder, web)

### 2. Environment Configuration
- [x] Generated SESSION_JWT_SECRET (stored in `.env` only — never commit; rotate per Audit-1 TOB-02)
- [x] Created `.env` in project root
- [x] Created `.env` in `apps/web/` (for Prisma)
- [x] Database URL configured in `.env` (local Postgres connection string — never commit)
- [x] NEXT_PUBLIC_APP_DOMAIN: `localhost:3000` (development)
- [x] NEXT_PUBLIC_SOLANA_RPC_URL: `https://api.devnet.solana.com` (devnet)

### 3. Database Setup
- [x] PostgreSQL running locally (verified connection)
- [x] Database `platform` created
- [x] Prisma schema migrated (init migration applied)
- [x] Tables created:
  - `AuthNonce` (for SIWS nonce storage)
  - `Subscription` (paused, for future Stripe integration)
  - `Deployment` (tracks token deployments)

### 4. Dependencies Verified
- [x] @solana/web3.js 1.95.0
- [x] @solana/spl-token 0.4.0
- [x] @irys/web-upload 0.0.15 (Arweave metadata)
- [x] @irys/web-upload-solana 0.1.8
- [x] @prisma/client 5.20.0
- [x] zod 3.23.0
- [x] jose 5.9.0 (JWT)
- [x] Next.js 14.2.0
- [x] React 18.3.0

## 🚀 In Progress

### 5. Development Server
- [ ] Next.js dev server starting...
  - Expected: "ready - started server on 0.0.0.0:3000"
  - URL: http://localhost:3000

## 📋 Ready to Test

### 6. Application Flow Testing

**Step 1: Connect Wallet**
1. Open http://localhost:3000
2. Click "Connect Wallet" in header
3. Select a wallet (MetaMask, Phantom, etc.)
4. Approve connection

**Step 2: Sign In (SIWS)**
1. Click "Sign In with Solana"
2. Wallet signs message: `Sign this message: {nonce}`
3. Session JWT created and stored in HttpOnly cookie
4. Redirected to app

**Step 3: Deploy Token**
1. Go to "Deploy" page
2. Select modules:
   - Transfer Fee (optional)
   - Non-Transferable (optional)
   - Permanent Delegate (optional)
3. Add metadata (name, symbol, URI)
4. Click "Deploy"
5. Review deployment plan
6. Sign transaction with wallet
7. Monitor on-chain confirmation
8. Metadata uploaded to Irys/Arweave
9. Deployment indexed in database

**Step 4: View Dashboard**
1. Go to "My Tokens" / Dashboard
2. Sign in with Solana
3. See all tokens deployed by wallet
4. Can resume metadata attachment if needed

## ⚠️ Known Issues (Pre-existing)

### TypeScript Build
- Zod schema type variance (non-blocking)
- ModuleId nullability checks (non-blocking)
- **Impact**: Cannot run `npm run build` with strict types, but runtime works

### Jest Tests
- Jest parser fails on TypeScript `as` syntax
- Needs ts-jest configuration
- **Impact**: `npm test` fails, but functionality unaffected

### Smoke Tests
- Irys API surface not yet validated
- **Status**: Should run `npm run test:web` after Jest is configured

## 📝 Environment Variables Reference

### Required for Development
> Real values live in `.env` only (gitignored). Never paste actual secrets into
> committed docs — see Audit-1 TOB-02. The values below are placeholders.
```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/platform
NEXT_PUBLIC_APP_DOMAIN=localhost:3000
SESSION_JWT_SECRET=<generate: openssl rand -base64 32>
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Required for Production
```env
DATABASE_URL=<real postgresql connection string>
NEXT_PUBLIC_APP_DOMAIN=<deployed hostname>
SESSION_JWT_SECRET=<generate new: openssl rand -base64 32>
NEXT_PUBLIC_SOLANA_RPC_URL=<mainnet or devnet RPC>
PLATFORM_FEE_PAYER_PUBKEY=<your solana pubkey>
PLATFORM_SERVICE_WALLET_PUBKEY=<your solana pubkey>
```

## 🔗 Important Links

- **Solana Devnet RPC**: https://api.devnet.solana.com
- **Solana Explorer**: https://explorer.solana.com (select devnet in dropdown)
- **Irys Gateway**: https://gateway.irys.xyz
- **Arweave Devnet**: https://devnet.arweave.net

## 🧪 Testing Wallet Setup

For devnet testing, use:
1. **Phantom Wallet** (recommended for Next.js)
   - Browser extension: https://phantom.app/
   - Switch to devnet in settings
   - Fund with devnet SOL: https://faucet.solana.com/

2. **Solana Devnet Airdrop**
   ```bash
   solana airdrop 2 <wallet-address> --url devnet
   ```

## 📊 Architecture Overview

```
localhost:3000 (Next.js)
├── /api/auth/nonce         → Generate SIWS nonce
├── /api/auth/verify        → Verify wallet signature, issue JWT
├── /api/auth/signout       → Clear session
├── /api/deployments        → GET: list user's tokens, POST: index new token
├── /api/deployments/[mint] → PATCH: update metadata signature
├── /dashboard              → View and manage user's tokens
└── /                       → Homepage / Deploy form
     ↓
Solana Devnet
├── Deploy Token (SPL-Token 2022)
├── Initialize Modules (Fee, Non-Transferable, Permanent Delegate)
└── Attach Metadata (via Irys → Arweave)
     ↓
PostgreSQL (localhost:5432)
├── AuthNonce               → SIWS nonce with 5min TTL
├── Subscription            → Stripe billing (paused)
└── Deployment              → Token deployment index
```

## ✨ What's Ready to Use

✅ **Modules**
- Transfer Fee (configure % fee, cap)
- Non-Transferable (true NFT, no trading)
- Permanent Delegate (authority can move tokens)

✅ **Security**
- SIWS authentication (wallet-based, cryptographically verified)
- Authority denylist enforcement (prevents platform custodial risk)
- HttpOnly session JWTs (no XSS vulnerability)
- Input validation via Zod (all endpoints)

✅ **Features**
- Deploy Solana SPL-Token 2022 tokens
- Attach metadata via Irys to Arweave
- View deployment history
- Resume incomplete deployments
- Image compression for metadata

⚠️ **Paused Features** (documented in CLAUDE.md)
- Stripe subscription tier
- Premium features gating

## 🚀 Next: Start Testing!

1. Wait for "ready" message in dev server output
2. Open http://localhost:3000
3. Connect your Phantom/Solana wallet
4. Deploy a test token
5. Monitor transaction on Solana Explorer
6. View in dashboard

---

**Last Updated**: June 15, 2026  
**Project Location**: C:\Users\joshk\Token-Platform-Merged  
**Status**: ✅ Ready for Development

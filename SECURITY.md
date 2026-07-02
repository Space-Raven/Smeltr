# Security at Smeltr

Smeltr is non-custodial token deployment infrastructure for Solana Token-2022.
This document explains what that means concretely, what Smeltr can and cannot
do, and how to report a vulnerability.

## The non-custodial architecture

Smeltr builds transaction instructions; **your wallet signs them.** The
platform never holds, requests, or transmits:

- Private keys or seed phrases
- Mint authority, freeze authority, or any Token-2022 extension authority
- User funds (SOL or tokens)

The deployment flow is: the browser builds the instruction set locally from
your configuration → you review the full plan (including the exact platform
fee) → your wallet signs and submits. The only ephemeral key involved is the
new mint account's keypair, generated in your browser, used for a single
signature at creation, and discarded.

## The platform-authority denylist

Every authority field in every module (transfer-fee config authority,
withheld-fee withdraw authority, permanent delegate, mint authority, freeze
authority) is checked against a denylist of platform-controlled public keys
before any instruction is constructed. If a configuration would grant a
Smeltr-controlled key authority over a user token, instruction building
throws and the deployment is refused.

- The denylist is compiled into the client bundle (`NEXT_PUBLIC_` env), so the
  check runs in the same place instructions are built.
- Production builds **fail closed**: if the denylist is unconfigured, all
  deployments are refused rather than silently unprotected.
- The enforcement code lives in `packages/module-registry` in this repository
  and is independently reviewable.

## Scope of what Smeltr *can* do

For transparency, the platform does operate:

- A hot wallet that funds Arweave metadata storage for premium uploads (never
  a token authority; it is itself on the denylist)
- A server-side deployment index (mint address, signature, wallet address) so
  your dashboard works across devices — registration requires on-chain proof
  that your wallet actually created the mint
- Session authentication via Sign-In with Solana (a signed message; signing in
  costs nothing and grants no spending authority)

## Reporting a vulnerability

Email **pjorg@smeltr.org** with subject `SECURITY`. Please include a
reproduction and impact assessment. We commit to:

- Acknowledgment within 48 hours
- No legal action for good-faith research that avoids user-data exposure and
  service disruption
- Credit (if desired) once a fix ships

Please do not open public issues for security reports.

## Known limitations (stated honestly)

- Client-side checks (including the denylist) can be bypassed by a fully
  modified client; they protect users of the real app, not adversaries
  attacking their own machine. Server-side plan validation is on the roadmap.
- Smeltr's module wrappers have not yet undergone an external security audit;
  the underlying SPL Token-2022 program has been audited independently by
  multiple firms. An audit of Smeltr's own layer is a stated roadmap item and
  the `verified` flag in the module registry remains `false` until it exists.

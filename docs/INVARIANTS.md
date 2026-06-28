# Architecture invariants (CI / agent review checklist)

Agents and human reviewers should block merges that violate any of these.

## On-chain / tx-builder

1. **Two-transaction metadata (permanent)** — Tx1 overfunds mint space; tx2 is `InitializeTokenMetadata` only. No `createReallocateInstruction`, no extra lamport transfer in tx2.
2. **Instruction order in tx1** — `CreateAccount` → module inits → `InitializeMetadataPointer` → `InitializeMint` (see `packages/tx-builder/src/orchestrator.ts`).
3. **`assertNoPlatformAuthority()`** — Called before every instruction build that sets an authority; denylist must not be bypassed.
4. **Extension collisions** — `validateModuleSelection` / `assertNoExtensionCollision` must run before building instructions.

## API / auth

5. **Deployment wallet from session** — POST/PATCH `/api/deployments` uses `getSessionWallet()` only; never trust wallet from request body.
6. **PATCH anti-enumeration** — Wrong owner returns **404** with the same body as missing mint (see deployment route tests).
7. **Stripe webhook** — Raw body + signature verification before updating `Subscription`.

## Product

8. **High-impact modules** — Permanent delegate requires explicit UI acknowledgment + hook re-check in `confirm()`.
9. **Non-custodial** — Platform never holds mint authority, freeze authority, or user funds in the deploy flow.

See `CLAUDE.md` for full architecture context.

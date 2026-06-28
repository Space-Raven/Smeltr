## Summary

<!-- What changed and why -->

## Invariant checklist

- [ ] Two-transaction metadata flow unchanged (no reallocate in tx2)
- [ ] Tx1 instruction order preserved if touching orchestrator
- [ ] No platform-held authorities (`assertNoPlatformAuthority` paths intact)
- [ ] Deployment API still uses session wallet, PATCH 404 anti-enumeration unchanged
- [ ] High-impact module gating unchanged if touching deploy/review flow

See [`docs/INVARIANTS.md`](../docs/INVARIANTS.md).

## Test plan

- [ ] `npm run test:ci` passes locally
- [ ] Manual devnet check (if touching deploy / Irys / wallet)

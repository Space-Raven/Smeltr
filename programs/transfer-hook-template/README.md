# transfer-hook-template (placeholder)

No custom Anchor program exists yet. This directory exists so that adding
a future custom Transfer Hook program is additive — a new program
directory here, a new `MetadataProvider`/`ModuleDefinition`-style entry in
`packages/module-registry`, and a new builder in
`packages/tx-builder/src/builders/` — without restructuring the rest of
the monorepo.

All three currently-implemented modules (Transfer Fee, Non-Transferable,
Permanent Delegate) are native Token-2022 mint extensions and require no
custom on-chain program. See `/CLAUDE.md` for the full architecture
overview.

When a custom Transfer Hook is added:

- Initialize with `anchor init` inside this directory (or replace it
  entirely — nothing outside `programs/` depends on its current contents).
- Any Transfer Hook program added to the registry must go through a
  third-party security audit before being marked `verified: true` — see
  the "Critical Security Path" notes in `packages/module-registry/src/schema.ts`
  regarding `ModuleDefinition.auditReference`.

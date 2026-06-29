// authority.ts removed (Audit-1 TOB-14): it held a permanently-empty duplicate
// of PLATFORM_AUTHORITY_DENYLIST / assertNoPlatformAuthority. The single source
// of truth is @platform/module-registry.
export * from "./solana-schemas";

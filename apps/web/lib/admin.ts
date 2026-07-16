/**
 * Admin authorization — server-side only.
 *
 * Admin = a SIWS session whose wallet is in the platform admin allowlist. This
 * reuses the non-custodial auth model (no passwords): the founder signs in with
 * an admin wallet, and admin endpoints check the session wallet against
 * PLATFORM_ADMIN_PUBKEYS. Falls back to PLATFORM_FOUNDER_PUBKEY so a single-
 * operator setup works with the wallet already configured for the sweeper.
 *
 * NOT NEXT_PUBLIC_ — the allowlist must never reach the client bundle; the check
 * runs only in API routes.
 */

export function parseAdminPubkeys(
  env: Record<string, string | undefined> = process.env
): ReadonlySet<string> {
  const raw = env.PLATFORM_ADMIN_PUBKEYS ?? env.PLATFORM_FOUNDER_PUBKEY ?? "";
  return new Set(raw.split(/[\s,]+/).filter((k) => k.length > 0));
}

export function isAdminWallet(
  wallet: string | null | undefined,
  admins: ReadonlySet<string> = parseAdminPubkeys()
): boolean {
  return !!wallet && admins.has(wallet);
}

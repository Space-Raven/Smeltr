import { NextResponse } from "next/server";
import { getDenylistDebugSnapshot } from "@platform/module-registry";

/**
 * GET /api/debug/denylist
 *
 * Compare server-side env vs what the client bundle should have inlined.
 * Pubkeys in parsedKeys are public — this endpoint is for TOB-01 ops/debug only.
 *
 * Usage:
 *   curl https://smeltr.org/api/debug/denylist
 *
 * Interpretation:
 *   - server.parsedKeyCount > 0 but client (browser console on /deploy?debug=denylist)
 *     shows parsedKeyCount === 0 → env var was missing at BUILD time; redeploy after
 *     setting NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST.
 *   - both zero → var unset or empty on server too (check Vercel env + no quotes).
 *   - both > 0 → denylist OK; failure is elsewhere.
 */
export async function GET() {
  const server = getDenylistDebugSnapshot();
  return NextResponse.json({
    server,
    hints: [
      "NEXT_PUBLIC_* values are baked into the client JS at build time — saving env in Vercel without redeploying does not update the browser bundle.",
      "Value format: Pubkey1,Pubkey2 (no quotes, comma-separated base58).",
      "Must be enabled for Production and available at Build Time in Vercel.",
    ],
    ts: Date.now(),
  });
}

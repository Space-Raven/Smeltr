import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * GET /api/alerts/unsubscribe?token=… — one-click unsubscribe from every
 * alert email. DELETES the row: the email↔wallet link is fully severed, not
 * flagged ("delete = gone" — operator PII posture).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) {
    return redirectTo("/?alerts=invalid");
  }

  const subscription = await prisma.alertSubscription.findUnique({
    where: { unsubToken: token },
  });
  if (!subscription) {
    // Already deleted — idempotent success from the user's point of view.
    return redirectTo("/?alerts=deleted");
  }

  await prisma.alertSubscription.delete({ where: { id: subscription.id } });
  return redirectTo(`/t/${subscription.mintAddress}?alerts=deleted`);
}

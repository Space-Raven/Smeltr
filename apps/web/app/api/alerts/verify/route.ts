import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * GET /api/alerts/verify?token=… — double-opt-in confirmation link from the
 * verification email. Token-authenticated (no session needed — the click may
 * come from a mail client on another device).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) {
    return redirectTo("/?alerts=invalid");
  }

  const subscription = await prisma.alertSubscription.findUnique({
    where: { verifyToken: token },
  });
  if (!subscription) {
    return redirectTo("/?alerts=invalid");
  }

  if (!subscription.verifiedAt) {
    await prisma.alertSubscription.update({
      where: { id: subscription.id },
      data: { verifiedAt: new Date() },
    });
  }

  return redirectTo(`/manage/${subscription.mintAddress}?alerts=on`);
}

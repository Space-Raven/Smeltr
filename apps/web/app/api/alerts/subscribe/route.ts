import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { getSessionWallet } from "../../../../lib/session";
import { DEFAULT_CHAIN_ID } from "../../../../lib/constants";
import { SUPPORTED_CHAIN_IDS } from "../../../../lib/cluster";
import {
  buildVerifyEmail,
  isPlausibleEmail,
  newAlertToken,
  sendAlertEmail,
} from "../../../../lib/alerts";

const BASE58_PUBKEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const SubscribeSchema = z.object({
  chainId: z.enum(SUPPORTED_CHAIN_IDS).default(DEFAULT_CHAIN_ID as (typeof SUPPORTED_CHAIN_IDS)[number]),
  mintAddress: z.string().regex(BASE58_PUBKEY, "Invalid mint address"),
  email: z.string().max(254),
});

/** Don't resend a verification email more often than this. */
const RESEND_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * POST /api/alerts/subscribe — opt in to holder-milestone alerts.
 *
 * SIWS session required, and the session wallet must OWN the deployment
 * record — only a token's creator can attach an email to it. Double opt-in:
 * the row starts unverified and the cron ignores it until the emailed
 * verify link is clicked.
 */
export async function POST(req: Request) {
  const walletAddress = await getSessionWallet();
  if (!walletAddress) {
    return NextResponse.json({ error: "Sign in to enable alerts." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const validation = SubscribeSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const { chainId, mintAddress } = validation.data;
  const email = validation.data.email.trim().toLowerCase();
  if (!isPlausibleEmail(email)) {
    return NextResponse.json({ error: "That doesn't look like a valid email address." }, { status: 400 });
  }

  // Ownership gate — same 404-not-403 anti-enumeration posture as the
  // deployments API.
  const deployment = await prisma.deployment.findUnique({
    where: { chainId_mintAddress: { chainId, mintAddress } },
  });
  if (!deployment || deployment.walletAddress !== walletAddress) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.alertSubscription.findUnique({
    where: { chainId_mintAddress_email: { chainId, mintAddress, email } },
  });

  if (existing?.verifiedAt) {
    return NextResponse.json({ status: "active" });
  }

  if (existing && Date.now() - existing.updatedAt.getTime() < RESEND_COOLDOWN_MS) {
    return NextResponse.json(
      { status: "pending", note: "Verification email already sent — check your inbox." },
      { status: 429 }
    );
  }

  const verifyToken = newAlertToken();
  const subscription = existing
    ? await prisma.alertSubscription.update({
        where: { id: existing.id },
        data: { verifyToken, walletAddress },
      })
    : await prisma.alertSubscription.create({
        data: {
          chainId,
          mintAddress,
          walletAddress,
          email,
          verifyToken,
          unsubToken: newAlertToken(),
        },
      });

  const sent = await sendAlertEmail(
    email,
    buildVerifyEmail({
      tokenName: deployment.name,
      mintAddress,
      verifyToken: subscription.verifyToken,
    })
  );
  if (!sent) {
    return NextResponse.json(
      { error: "Could not send the verification email right now. Try again shortly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ status: "pending" });
}

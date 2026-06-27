import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "../../../../lib/stripe";
import { prisma } from "../../../../lib/prisma";

/**
 * POST /api/stripe/webhook
 *
 * Receives and processes Stripe webhook events. Signature verification is
 * MANDATORY — every event is authenticated against STRIPE_WEBHOOK_SECRET
 * before any DB write occurs. Never trust the event payload without this check.
 *
 * Events handled:
 *   customer.subscription.created  → upsert Subscription, status = active/trialing/etc.
 *   customer.subscription.updated  → update status + currentPeriodEnd
 *   customer.subscription.deleted  → set status = canceled
 *
 * The wallet address is stored in customer.metadata.walletAddress (set in
 * getOrCreateCustomer) and used as the Subscription primary key.
 *
 * Next.js App Router note: we use req.text() to get the raw body — Stripe's
 * signature check requires the exact bytes as received over the wire. Using
 * req.json() would re-serialize the JSON and break the HMAC.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    // Log but return 200 — Stripe retries on non-2xx, which could cause loops
    // if the error is non-transient (e.g. bad data).
    console.error("[stripe/webhook] Handler error:", err);
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const walletAddress = await resolveWalletAddress(sub.customer as string);
      if (!walletAddress) {
        console.warn("[stripe/webhook] No walletAddress on customer:", sub.customer);
        return;
      }

      await prisma.subscription.upsert({
        where: { walletAddress },
        create: {
          walletAddress,
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
        update: {
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const walletAddress = await resolveWalletAddress(sub.customer as string);
      if (!walletAddress) return;

      await prisma.subscription.upsert({
        where: { walletAddress },
        create: {
          walletAddress,
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          status: "canceled",
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
        update: {
          status: "canceled",
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });
      break;
    }

    default:
      // Unhandled event types — no-op, return 200 to Stripe.
      break;
  }
}

/** Fetch the customer from Stripe and extract the wallet address from metadata. */
async function resolveWalletAddress(customerId: string): Promise<string | null> {
  const customer = await getStripe().customers.retrieve(customerId);
  if (customer.deleted) return null;
  return (customer as Stripe.Customer).metadata?.walletAddress ?? null;
}

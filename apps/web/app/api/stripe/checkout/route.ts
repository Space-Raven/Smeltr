import { NextResponse } from "next/server";
import { getSessionWallet } from "../../../../lib/session";
import { getStripe, getStripePriceId, getOrCreateCustomer } from "../../../../lib/stripe";

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for the $19/mo premium subscription.
 * Requires an active SIWS session — the wallet address from the session
 * cookie is used as the stable identifier, never a value from the request body.
 *
 * Returns { url } — the client redirects to Stripe's hosted checkout page.
 * After payment, Stripe redirects to /dashboard?checkout=success (or ?canceled).
 *
 * The stripe webhook (/api/stripe/webhook) handles provisioning: it writes to
 * the Subscription table once `customer.subscription.created` fires, so the
 * checkout route itself does not update the DB.
 */
export async function POST(req: Request) {
  const walletAddress = await getSessionWallet();
  if (!walletAddress) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const customer = await getOrCreateCustomer(walletAddress);
    const priceId = getStripePriceId();

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
    const scheme = appDomain.startsWith("localhost") ? "http" : "https";
    const baseUrl = `${scheme}://${appDomain}`;

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
      // Allow the customer to manage their subscription via Stripe's portal.
      allow_promotion_codes: true,
      // Pre-fill email if the customer already has one.
      customer_update: { address: "auto" },
      metadata: { walletAddress },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

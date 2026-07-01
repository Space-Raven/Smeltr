import Stripe from "stripe";
import { assertValidWalletAddress } from "./solanaAddress";

/**
 * Lazy Stripe singleton. Throws at call time (not module load) if the secret
 * key is absent, so unit tests that never call getStripe() don't fail due to
 * missing env vars.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  return _stripe;
}

/** Price ID for the $19/mo premium subscription (set in Stripe dashboard). */
export function getStripePriceId(): string {
  const id = process.env.STRIPE_PRICE_ID;
  if (!id) throw new Error("STRIPE_PRICE_ID is not set");
  return id;
}

/**
 * Retrieve or create a Stripe customer for a given wallet address.
 *
 * The wallet address is stored in customer.metadata.walletAddress so the
 * webhook handler can map Stripe events back to the Subscription row without
 * needing a separate lookup table.
 */
export async function getOrCreateCustomer(walletAddress: string): Promise<Stripe.Customer> {
  const stripe = getStripe();

  // TOB-08: the address is interpolated into a Stripe Search Query Language
  // string below — treat it as code. A strict base58 check here guarantees no
  // quote/operator can break out of the literal, independent of upstream
  // constraints (today it's always a SIWS-verified pubkey, but this keeps the
  // guarantee if a future caller passes less-constrained input).
  assertValidWalletAddress(walletAddress);

  // Search for an existing customer with this wallet address in metadata.
  const existing = await stripe.customers.search({
    query: `metadata['walletAddress']:'${walletAddress}'`,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  return stripe.customers.create({
    metadata: { walletAddress },
    description: `Smeltr wallet: ${walletAddress}`,
  });
}

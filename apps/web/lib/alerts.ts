import { randomBytes } from "crypto";

/**
 * Holder-milestone alert plumbing (Phase D) — tokens, email copy, and the
 * Resend send call.
 *
 * PII posture (operator decision 2026-07-17): email via Resend as a
 * transactional pipe only — the address lives in OUR Postgres
 * (AlertSubscription) and is sent to Resend solely at send time. Double
 * opt-in (verify link before any alert), one-click unsubscribe, and
 * unsubscribe DELETES the row. No tracking pixels, no marketing lists.
 */

export const ALERTS_FROM_FALLBACK = "Smeltr Alerts <alerts@smeltr.org>";

export function newAlertToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isPlausibleEmail(value: string): boolean {
  // Deliverability is proven by the verification email, not the regex —
  // this only rejects obvious garbage and bounds length.
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function siteUrl(): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim() || "smeltr.org";
  return `https://${domain}`;
}

export interface AlertEmail {
  subject: string;
  text: string;
}

export function buildVerifyEmail(args: {
  tokenName: string | null;
  mintAddress: string;
  verifyToken: string;
}): AlertEmail {
  const base = siteUrl();
  const name = args.tokenName ?? shortMint(args.mintAddress);
  return {
    subject: `Confirm milestone alerts for ${name}`,
    text: [
      `You (or someone with your wallet) asked for holder-milestone alerts for ${name} on Smeltr.`,
      ``,
      `Confirm your email to switch them on:`,
      `${base}/api/alerts/verify?token=${args.verifyToken}`,
      ``,
      `If this wasn't you, ignore this email — nothing is stored as active until you confirm, and this link expires with the request.`,
      ``,
      `— Smeltr · non-custodial token tooling · ${base}`,
    ].join("\n"),
  };
}

export function buildMilestoneEmail(args: {
  tokenName: string | null;
  mintAddress: string;
  milestone: number;
  holderCount: number;
  unsubToken: string;
}): AlertEmail {
  const base = siteUrl();
  const name = args.tokenName ?? shortMint(args.mintAddress);
  return {
    subject: `${name} just passed ${args.milestone} holders 🔨`,
    text: [
      `${name} crossed ${args.milestone} holders (${args.holderCount} at last count).`,
      ``,
      `Forged milestones worth a look:`,
      `· Your token's public page: ${base}/t/${args.mintAddress}`,
      `· Manage it (authorities, fees): ${base}/manage/${args.mintAddress}`,
      ``,
      `Fair-launch tokens are eligible to be featured on ${base}/created.`,
      ``,
      `Unsubscribe (deletes your email from Smeltr immediately):`,
      `${base}/api/alerts/unsubscribe?token=${args.unsubToken}`,
    ].join("\n"),
  };
}

function shortMint(mint: string): string {
  return `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}

/**
 * Send via Resend's REST API (no SDK dependency). Returns false — never
 * throws — when the key is missing or the API errors, so alert failures can
 * never break a request path; callers decide whether to surface it.
 */
export async function sendAlertEmail(to: string, email: AlertEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[alerts] RESEND_API_KEY not set — email not sent:", email.subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.ALERTS_FROM_EMAIL?.trim() || ALERTS_FROM_FALLBACK,
        to: [to],
        subject: email.subject,
        text: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[alerts] Resend send failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[alerts] Resend send threw:", err);
    return false;
  }
}

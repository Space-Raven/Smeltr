import { useEffect, useState } from "react";

type SubscriptionStatus = "loading" | "premium" | "free" | "error";

/**
 * Fetches the current user's subscription status from /api/subscription.
 *
 * Returns "premium" if the wallet has an active/trialing Stripe subscription,
 * "free" if not, "loading" while the request is in flight, and "error" on
 * fetch failure.
 *
 * Callers should treat "error" as "free" for UX purposes — fall back to the
 * client-funded upload path rather than blocking the user entirely.
 */
export function useSubscription(): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription", { credentials: "same-origin" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) { setStatus("free"); return; }
        if (!res.ok) { setStatus("error"); return; }
        const { premium } = await res.json() as { premium: boolean };
        setStatus(premium ? "premium" : "free");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, []);

  return status;
}

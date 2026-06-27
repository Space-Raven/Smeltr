import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { SolanaSignInInput, SolanaSignInOutput } from "@solana/wallet-standard-features";
import { toWireOutput } from "../lib/siws";

type Status = "idle" | "signing" | "verifying" | "authenticated" | "error";

interface SignInAdapter {
  signIn(input: SolanaSignInInput): Promise<SolanaSignInOutput>;
}

/**
 * Sign-In with Solana flow:
 *   1. Request a server-generated, single-use nonce + full SolanaSignInInput
 *      (the server defines domain/statement/uri/version — the client only
 *      ever passes the nonce it was given through to the wallet unmodified).
 *   2. Have the connected wallet sign that input via the Wallet Standard
 *      `signIn` method.
 *   3. POST the (wire-serialized) output to /api/auth/verify, which checks
 *      the nonce, verifies the signature, and sets an httpOnly session
 *      cookie.
 *
 * Optional — only required to use /dashboard. The core deploy flow works
 * without ever calling this.
 */
export function useSiwsAuth() {
  const wallet = useWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    const adapter = wallet.wallet?.adapter as unknown as SignInAdapter | undefined;
    if (!adapter?.signIn) {
      setError("Connected wallet does not support Sign-In with Solana.");
      setStatus("error");
      return;
    }

    setStatus("signing");
    setError(null);

    try {
      const nonceRes = await fetch("/api/auth/nonce", { method: "POST" });
      if (!nonceRes.ok) throw new Error("Failed to obtain sign-in nonce.");
      const { input } = (await nonceRes.json()) as { input: SolanaSignInInput };

      const output = await adapter.signIn(input);

      setStatus("verifying");
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin", // ensure the session cookie is set
        body: JSON.stringify({ input, output: toWireOutput(output) }),
      });

      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Sign-in verification failed.");
      }

      const { walletAddress: verifiedAddress } = await verifyRes.json();
      setWalletAddress(verifiedAddress);
      setStatus("authenticated");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, [wallet.wallet]);

  return { walletAddress, status, error, signIn };
}

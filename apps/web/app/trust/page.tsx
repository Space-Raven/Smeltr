import type { Metadata } from "next";
import { LegalShell } from "../../components/LegalShell";

export const metadata: Metadata = {
  title: "Trust Center — Smeltr",
  description:
    "How Smeltr protects your keys, what we never touch, and our non-custodial guarantees.",
};

export default function TrustPage() {
  return (
    <LegalShell title="Trust Center" updated="July 2, 2026">
      <p>
        Smeltr is non-custodial infrastructure. We build Solana Token-2022 transaction
        instructions; your wallet signs and pays for everything on-chain.
      </p>

      <h2>What Smeltr never holds</h2>
      <ul>
        <li>Your wallet secret keys or seed phrase</li>
        <li>Mint authority, freeze authority, or permanent delegate authority over your tokens</li>
        <li>Token balances or user funds</li>
        <li>The ability to sign transactions on your behalf</li>
      </ul>

      <h2>What Smeltr does</h2>
      <ul>
        <li>Validates module configurations against the Token-2022 spec</li>
        <li>Constructs unsigned transactions for your review</li>
        <li>Optionally indexes deployments you choose to save (requires Sign-In with Solana)</li>
        <li>Charges a transparent per-deployment protocol fee (shown before you sign)</li>
      </ul>

      <h2>Platform authority denylist</h2>
      <p>
        Before any transaction is built, authority fields are checked against a denylist of
        platform-controlled public keys. Smeltr cannot assign itself mint, freeze, fee, or
        delegate authority over your token.
      </p>

      <h2>What we do not do</h2>
      <ul>
        <li>List, price, discover, or trade your token</li>
        <li>Provide market-making or financial advice</li>
        <li>Custody assets or operate as an exchange</li>
      </ul>

      <h2>Security disclosure</h2>
      <p>
        Report vulnerabilities to{" "}
        <a href="mailto:security@smeltr.org" className="text-amber-700 underline">
          security@smeltr.org
        </a>
        . See our{" "}
        <a href="https://github.com/Space-Raven/Smeltr/blob/main/SECURITY.md" className="text-amber-700 underline">
          SECURITY.md
        </a>{" "}
        for responsible disclosure policy.
      </p>

      <h2>Legal</h2>
      <p>
        <a href="/terms" className="text-amber-700 underline">Terms of Service</a>
        {" · "}
        <a href="/privacy" className="text-amber-700 underline">Privacy Policy</a>
        {" · "}
        <a href="/refunds" className="text-amber-700 underline">Refund Policy</a>
      </p>
    </LegalShell>
  );
}

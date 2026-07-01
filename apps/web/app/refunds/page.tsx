import type { Metadata } from "next";
import { LegalShell } from "../../components/LegalShell";

export const metadata: Metadata = {
  title: "Refund Policy — Smeltr",
  description:
    "Refund policy for Smeltr protocol fees and Smeltr+ subscriptions.",
};

export default function RefundsPage() {
  return (
    <LegalShell title="Refund Policy" updated="July 1, 2026">
      <p>
        This Refund Policy applies to all fees charged by Smeltr Technologies LLC
        (&quot;Smeltr&quot;) through the Platform at smeltr.org.
      </p>

      <h2>1. Protocol Fees (Per-Deployment)</h2>
      <p>
        <strong>Protocol fees are non-refundable.</strong>
      </p>
      <p>
        The Smeltr protocol fee is included as an instruction in the deployment transaction that
        you sign and submit to the Solana blockchain. Once a transaction is confirmed on-chain, it
        is permanent and irreversible by Smeltr or any other party. We have no technical ability
        to reverse confirmed blockchain transactions or return SOL transferred as part of a
        confirmed transaction.
      </p>
      <p>
        <strong>If a deployment transaction fails or is not confirmed on-chain</strong>, no fee has
        been transferred and no refund is necessary. Failed transactions do not result in a
        protocol fee charge.
      </p>
      <p>
        Before signing any transaction, review the deployment summary screen, which displays the
        protocol fee amount clearly. Do not sign if you do not agree to the fee.
      </p>

      <h2>2. Smeltr+ Subscription Fees</h2>

      <h3>2.1 Initial Subscription — 7-Day Refund Window</h3>
      <p>
        If you subscribe to Smeltr+ and have <strong>not used any Smeltr+ features</strong> during
        the first 7 days following your initial subscription purchase, you may request a full
        refund of the first month&apos;s subscription fee.
      </p>
      <p>&quot;Smeltr+ features&quot; includes but is not limited to:</p>
      <ul>
        <li>Using the platform-funded metadata upload service</li>
        <li>Uploading files above the free-tier storage limits</li>
        <li>Accessing any module or capability released as a Smeltr+ early-access feature</li>
      </ul>
      <p>
        To request a refund under this policy, contact billing@smeltr.org within 7 days of your
        initial purchase with the subject line &quot;Refund Request&quot; and include the wallet
        address associated with your account. We will process eligible refunds within 10 business
        days.
      </p>

      <h3>2.2 Subscription Renewals</h3>
      <p>
        <strong>Renewal charges are non-refundable.</strong> Your subscription renews automatically
        at the start of each billing period. If you do not wish to renew, cancel your subscription
        before the renewal date through the dashboard or by contacting billing@smeltr.org.
        Cancellation stops future renewals but does not generate a refund for the current period.
      </p>

      <h3>2.3 Accidental Charges</h3>
      <p>
        If you believe you were charged in error — for example, if a technical issue caused a
        duplicate charge — contact billing@smeltr.org within 30 days of the charge. We will
        investigate and refund confirmed billing errors promptly.
      </p>

      <h3>2.4 Feature Degradation</h3>
      <p>
        If Smeltr materially reduces the features included in Smeltr+ during your active
        subscription period, you are entitled to a prorated refund for the remaining days of the
        affected billing period upon request. Contact billing@smeltr.org to request this
        adjustment. Feature additions, changes to the user interface, or changes to infrastructure
        providers do not constitute material feature degradation.
      </p>

      <h2>3. Solana Network Fees</h2>
      <p>
        Solana network fees (&quot;transaction fees&quot;) paid to Solana validators are set by the
        Solana network and are not charged by Smeltr. These fees are beyond our control and are
        non-refundable under any circumstances. Smeltr is not responsible for network fee
        fluctuations.
      </p>

      <h2>4. Metadata Upload Fees (Free Tier — Irys/Arweave)</h2>
      <p>
        When using the free tier, metadata upload costs are paid directly by your wallet to the
        Irys network for storage on Arweave. These payments are made to a third-party service and
        are not Smeltr fees. Smeltr has no ability to refund or reverse Irys upload payments.
      </p>

      <h2>5. How to Request a Refund</h2>
      <p>Contact us at <strong>billing@smeltr.org</strong> with:</p>
      <ul>
        <li>The email address or wallet address associated with your account</li>
        <li>The date of the charge</li>
        <li>The reason for the refund request</li>
        <li>Your Stripe customer ID if available (visible in your billing receipts)</li>
      </ul>
      <p>We aim to respond to all refund requests within 2 business days.</p>

      <h2>6. Contact</h2>
      <p>
        Smeltr Technologies LLC (Arizona, USA)
        <br />
        billing@smeltr.org
      </p>
    </LegalShell>
  );
}

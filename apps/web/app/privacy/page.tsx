import type { Metadata } from "next";
import { LegalShell } from "../../components/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Smeltr",
  description:
    "How Smeltr collects, uses, and protects information. We never collect private keys, and we do not sell your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="July 1, 2026">
      <p>
        Smeltr Technologies LLC (&quot;Smeltr,&quot; &quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;) operates smeltr.org and associated subdomains (the &quot;Platform&quot;).
        This Privacy Policy explains what information we collect, how we use it, and your rights
        regarding that information.
      </p>
      <p>
        <strong>The short version:</strong> We collect the minimum data necessary to operate the
        Platform. We never collect private keys, seed phrases, or wallet funds. Wallet addresses
        are pseudonymous identifiers, not personal data by default. We do not sell your data.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Information You Provide Directly</h3>
      <p>
        <strong>Wallet address.</strong> When you connect a wallet to the Platform, we receive your
        Solana public key (wallet address). This is a pseudonymous identifier — it does not
        directly identify you as an individual unless linked to other information you provide. We
        use your wallet address to associate deployments with your account and to authenticate
        sessions via Sign-In with Solana (SIWS).
      </p>
      <p>
        <strong>Email address (optional).</strong> If you choose to provide an email address, we
        use it to send deployment confirmations and Smeltr+ account communications. Email is never
        required to use the core deployment features of the Platform.
      </p>
      <p>
        <strong>Payment information.</strong> Smeltr+ subscription payments are processed by
        Stripe. We do not receive or store your credit card number, bank account details, or other
        payment credentials. Stripe handles all payment data subject to their Privacy Policy
        (stripe.com/privacy). We receive from Stripe only a customer ID, subscription status, and
        billing period information.
      </p>
      <p>
        <strong>Uploaded content.</strong> Metadata you upload through the Platform (token images,
        names, symbols, descriptions) is uploaded to Arweave via Irys. This content is stored
        permanently on a public, decentralized storage network. Do not upload private or sensitive
        information as token metadata. Once uploaded to Arweave, content cannot be deleted.
      </p>

      <h3>1.2 Information Collected Automatically</h3>
      <p>
        <strong>Deployment records.</strong> When you deploy a token using the Platform, we record
        the mint address, transaction signature, wallet address, deployment timestamp, and
        configuration options (extensions used, whether metadata was attached). This is used to
        populate your dashboard and support cross-device resumability.
      </p>
      <p>
        <strong>Session data.</strong> We use an encrypted, httpOnly JWT cookie to maintain
        authenticated sessions. This cookie contains your wallet address and session expiry. It is
        not accessible to client-side JavaScript and is not used for tracking purposes.
      </p>
      <p>
        <strong>Usage analytics.</strong> We do not currently run third-party analytics that
        identify individual users. If we adopt anonymous, aggregate usage analytics in the future,
        this policy will be updated first.
      </p>
      <p>
        <strong>Log data.</strong> Our servers automatically record standard log data including IP
        addresses, browser type, pages visited, and timestamps. Logs are retained for up to 30
        days and used for security monitoring and debugging.
      </p>

      <h3>1.3 Information We Do Not Collect</h3>
      <ul>
        <li>
          Private keys or seed phrases (we never ask for these, and you should never share them
          with anyone)
        </li>
        <li>
          Wallet balances or transaction history beyond what you explicitly deploy through our
          Platform
        </li>
        <li>Biometric data, government ID, or any KYC information</li>
        <li>Location data beyond what is inferable from IP address</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Operate and maintain the Platform and its features</li>
        <li>Authenticate your sessions via Sign-In with Solana</li>
        <li>Record and display your deployment history in the dashboard</li>
        <li>Process Smeltr+ subscription payments via Stripe</li>
        <li>Send transactional communications to the email address you provide</li>
        <li>Monitor for security threats, abuse, and unauthorized access</li>
        <li>Improve the Platform based on usage patterns</li>
        <li>Comply with applicable legal obligations</li>
      </ul>
      <p>
        We do not use your information to serve advertising. We do not sell your data to third
        parties. We do not use your wallet address or deployment history to make investment
        recommendations.
      </p>

      <h2>3. Information Sharing</h2>
      <p>We share your information only in the following circumstances:</p>
      <p>
        <strong>Service providers.</strong> We share data with third-party service providers who
        help us operate the Platform, including Stripe (payments), Irys/Arweave (metadata
        storage), Solana RPC providers (blockchain access), and hosting providers. These providers
        are contractually obligated to use your data only to provide their services to us.
      </p>
      <p>
        <strong>Legal requirements.</strong> We may disclose information if required by law,
        regulation, legal process, or governmental request, or if we believe disclosure is
        necessary to protect the rights, property, or safety of Smeltr, our users, or the public.
      </p>
      <p>
        <strong>Business transfers.</strong> If Smeltr Technologies LLC is acquired, merges with
        another entity, or transfers substantially all of its assets, your information may be
        transferred as part of that transaction. We will notify you via email or Platform notice
        before your information is transferred and becomes subject to a different privacy policy.
      </p>
      <p>
        <strong>With your consent.</strong> We may share your information for other purposes with
        your explicit consent.
      </p>

      <h2>4. Blockchain Data</h2>
      <p>
        <strong>Transactions you submit through the Platform are recorded permanently on the
        Solana blockchain, which is public and immutable.</strong> Mint addresses, transaction
        signatures, and on-chain token configurations are visible to anyone. Smeltr does not
        control and cannot alter this public blockchain data. This is a fundamental property of
        public blockchain networks, not a privacy practice of Smeltr.
      </p>
      <p>
        Metadata uploaded to Arweave is similarly permanent and public. Do not include personal or
        sensitive information in token names, symbols, descriptions, or images.
      </p>

      <h2>5. Data Retention</h2>
      <ul>
        <li>
          <strong>Wallet-linked deployment records</strong> are retained for as long as your
          account is active and for a reasonable period thereafter to support cross-device
          resumability and dashboard history.
        </li>
        <li>
          <strong>Session cookies</strong> expire after 24 hours or upon sign-out.
        </li>
        <li>
          <strong>Authentication nonces</strong> are single-use and expire after 5 minutes
          regardless of use.
        </li>
        <li>
          <strong>Log data</strong> is retained for up to 30 days.
        </li>
        <li>
          <strong>Email addresses</strong> are retained until you request deletion or unsubscribe
          from all communications.
        </li>
      </ul>
      <p>
        You may request deletion of your non-blockchain data by contacting privacy@smeltr.org. We
        will fulfill deletion requests within 30 days except where retention is required by law or
        legitimate business interest.
      </p>

      <h2>6. Cookies</h2>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>session</code>
            </td>
            <td>Authenticated session JWT (httpOnly, Secure)</td>
            <td>24 hours</td>
          </tr>
        </tbody>
      </table>
      <p>
        We do not use advertising cookies, tracking pixels, or third-party analytics cookies that
        identify individual users.
      </p>

      <h2>7. Security</h2>
      <p>
        We implement reasonable technical and organizational measures to protect your information,
        including encrypted session cookies, HTTPS-only transport, and server-side validation of
        all authentication tokens. However, no system is perfectly secure. We cannot guarantee
        that your information will never be accessed, disclosed, or altered by unauthorized
        parties. Promptly notify us at security@smeltr.org if you believe your account has been
        compromised.
      </p>

      <h2>8. Children&apos;s Privacy</h2>
      <p>
        The Platform is not directed to individuals under the age of 18. We do not knowingly
        collect personal information from minors. If you believe we have inadvertently collected
        information from a minor, please contact us at privacy@smeltr.org and we will delete it
        promptly.
      </p>

      <h2>9. International Users</h2>
      <p>
        Smeltr Technologies LLC is based in Arizona, United States. If you access the Platform from
        outside the United States, your information will be transferred to and processed in the
        United States. By using the Platform, you consent to this transfer. We make no
        representation that the Platform is appropriate or available for use in all jurisdictions.
      </p>

      <h2>10. Your Rights</h2>
      <ul>
        <li>
          <strong>Access</strong> the deployment and account data we hold about you by signing in
          to the dashboard
        </li>
        <li>
          <strong>Request deletion</strong> of your non-blockchain data by contacting
          privacy@smeltr.org
        </li>
        <li>
          <strong>Opt out</strong> of marketing emails by using the unsubscribe link in any email
          or by contacting us
        </li>
        <li>
          <strong>Withdraw consent</strong> to optional data collection at any time
        </li>
      </ul>
      <p>
        Note: We cannot delete data recorded on the Solana blockchain or Arweave, as these are
        public, decentralized networks outside our control.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material
        changes by posting the updated policy on the Platform and updating the &quot;Last
        Updated&quot; date. Your continued use of the Platform after changes are posted
        constitutes your acceptance of the updated policy.
      </p>

      <h2>12. Contact</h2>
      <p>
        Smeltr Technologies LLC (Arizona, USA)
        <br />
        privacy@smeltr.org
      </p>
    </LegalShell>
  );
}

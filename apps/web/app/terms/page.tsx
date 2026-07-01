import type { Metadata } from "next";
import { LegalShell } from "../../components/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service — Smeltr",
  description:
    "Terms of Service for Smeltr, the non-custodial Solana Token-2022 deployment platform.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="July 1, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of the services,
        software, and website operated by Smeltr Technologies LLC (&quot;Smeltr,&quot; &quot;we,&quot;
        &quot;us,&quot; or &quot;our&quot;) at smeltr.org and any associated subdomains (collectively,
        the &quot;Platform&quot;). By accessing or using the Platform, you agree to be bound by these
        Terms. If you do not agree, do not use the Platform.
      </p>

      <h2>1. Description of Service</h2>
      <p>
        Smeltr provides a non-custodial software platform that enables users to construct Solana
        Token-2022 token deployment transactions. The Platform generates transaction instructions
        and presents them for your review. <strong>You sign all transactions using your own wallet.
        Smeltr never holds, controls, or has access to your private keys, wallet funds, mint
        authority, freeze authority, or any other cryptographic authority over your tokens or
        assets.</strong>
      </p>
      <p>
        The Platform is infrastructure tooling. It is not a financial institution, broker-dealer,
        investment advisor, exchange, custodian, or wallet provider.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years of age to use the Platform. By using the Platform, you
        represent and warrant that you meet this requirement and have the legal capacity to enter
        into these Terms in your jurisdiction.
      </p>
      <p>
        The Platform is not available to residents of jurisdictions where the use of
        blockchain-based software tools is prohibited or restricted by applicable law. You are
        solely responsible for determining whether your use of the Platform is lawful in your
        jurisdiction.
      </p>

      <h2>3. Non-Custodial Architecture — Critical Disclosure</h2>
      <p>
        <strong>Read this section carefully.</strong>
      </p>
      <p>3.1 Smeltr is a non-custodial platform. We build transaction instructions; you sign them. We do not and cannot:</p>
      <ul>
        <li>Access your private keys or seed phrase</li>
        <li>Sign transactions on your behalf</li>
        <li>Transfer, hold, freeze, burn, or otherwise control your tokens or SOL</li>
        <li>Recover assets sent to incorrect addresses</li>
        <li>Reverse or modify any on-chain transaction after it has been submitted</li>
      </ul>
      <p>
        3.2 All token deployments are permanent and irreversible on the Solana blockchain. Once a
        transaction is confirmed on-chain, the token and its configured extensions cannot be
        modified, reversed, or deleted by Smeltr or by anyone other than the authority addresses
        you specify at deployment.
      </p>
      <p>
        3.3 The Token-2022 extensions available on the Platform — including but not limited to
        Permanent Delegate, Transfer Fee, and Non-Transferable — have significant and permanent
        implications for the tokens you create and for any holders of those tokens. You are solely
        responsible for understanding these implications before deploying. Smeltr provides
        documentation and configuration guidance as a courtesy; this guidance does not constitute
        legal, financial, or technical advice and does not substitute for your own due diligence.
      </p>
      <p>
        3.4 <strong>The Permanent Delegate extension grants a designated wallet address
        unconditional authority to transfer or burn tokens from any holder&apos;s wallet,
        regardless of the holder&apos;s consent.</strong> If you deploy a token with this
        extension, you assume full legal and ethical responsibility for all uses of that
        authority.
      </p>

      <h2>4. Platform Fees</h2>
      <p>
        4.1 <strong>Protocol Fee.</strong> Smeltr charges a flat fee per token deployment, payable
        in SOL, included as an instruction in the deployment transaction you sign. The current fee
        is displayed on the deployment review screen before you sign. Protocol fees are
        <strong> non-refundable</strong> — they are embedded in on-chain transactions and cannot be
        reversed once the transaction is confirmed.
      </p>
      <p>
        4.2 <strong>Smeltr+ Subscription.</strong> Smeltr offers a premium subscription tier
        (&quot;Smeltr+&quot;) at the price displayed on the Platform at the time of purchase.
        Subscription fees are charged to a payment method on file with our payment processor,
        Stripe. Subscriptions renew automatically unless cancelled. You may cancel your
        subscription at any time through the dashboard or by contacting us at billing@smeltr.org.
      </p>
      <p>
        4.3 <strong>Solana Network Fees.</strong> All on-chain transactions require network fees
        paid in SOL to Solana validators. These fees are set by the Solana network, not by Smeltr,
        and are separate from the Smeltr protocol fee.
      </p>

      <h2>5. Subscription Terms (Smeltr+)</h2>
      <p>
        5.1 <strong>Billing.</strong> Smeltr+ is billed monthly in advance. Payment is processed by
        Stripe. By subscribing, you authorize recurring charges to your payment method.
      </p>
      <p>
        5.2 <strong>Cancellation.</strong> You may cancel at any time. Cancellation takes effect at
        the end of the current billing period. You retain access to Smeltr+ features until the
        period ends.
      </p>
      <p>
        5.3 <strong>Refunds.</strong> Subscription fees may be refunded within 7 days of the
        initial purchase if you have not used any Smeltr+ features during that period. After 7
        days, or after any Smeltr+ feature has been used, subscription fees are non-refundable.
        Renewals are non-refundable. See our <a href="/refunds">Refund Policy</a> for details. To
        request a refund, contact billing@smeltr.org within the eligible window.
      </p>
      <p>
        5.4 <strong>Feature Changes.</strong> Smeltr may add, modify, or remove features included
        in Smeltr+ with 30 days&apos; notice. Material reductions in Smeltr+ features entitle
        active subscribers to a prorated refund for the affected period upon request.
      </p>

      <h2>6. Prohibited Uses</h2>
      <p>You agree not to use the Platform to:</p>
      <ul>
        <li>
          Deploy tokens intended to deceive, defraud, or misrepresent their nature to potential
          holders or purchasers (&quot;rug pulls,&quot; exit scams, or pump-and-dump schemes)
        </li>
        <li>
          Violate any applicable law or regulation, including securities laws, anti-money
          laundering regulations, or sanctions programs
        </li>
        <li>
          Deploy tokens that falsely represent affiliation with any person, organization,
          government, or existing project
        </li>
        <li>
          Use the Permanent Delegate extension to seize, burn, or transfer tokens from holders
          without lawful authority and appropriate disclosure to those holders
        </li>
        <li>
          Attempt to circumvent, reverse-engineer, or abuse the Platform&apos;s subscription
          gating, authentication, or rate limiting systems
        </li>
        <li>
          Use the Platform&apos;s API in a manner that exceeds your authorized tier or that
          constitutes unauthorized access
        </li>
        <li>Upload malicious, illegal, or infringing content to the metadata upload service</li>
      </ul>
      <p>
        Smeltr reserves the right to suspend or terminate access to the Platform for violations of
        this section, without liability to you and without prejudice to any other remedies.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        7.1 The Platform, including its software, design, documentation, and content, is owned by
        Smeltr Technologies LLC and protected by applicable intellectual property laws.
      </p>
      <p>
        7.2 Portions of the Platform may be made available as open-source software under separate
        license terms. Where open-source licenses apply, those licenses govern the applicable
        components.
      </p>
      <p>
        7.3 Tokens deployed through the Platform are created by you, not by Smeltr. Smeltr makes no
        claim to ownership of tokens you deploy or metadata you upload.
      </p>
      <p>
        7.4 Metadata uploaded through the Platform is stored permanently on Arweave via Irys. You
        represent that you have all necessary rights to upload such content and that it does not
        infringe any third-party intellectual property rights.
      </p>

      <h2>8. No Financial Advice</h2>
      <p>
        Nothing on the Platform constitutes financial advice, investment advice, trading advice, or
        any other form of advice. Smeltr is infrastructure tooling. Token deployment decisions,
        tokenomics, pricing, distribution, and all other financial and strategic decisions are
        solely your responsibility. We strongly recommend consulting qualified legal and financial
        professionals before deploying any token intended for public distribution or commercial
        use.
      </p>

      <h2>9. Disclaimer of Warranties</h2>
      <p>
        THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTY OF
        ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED AVAILABILITY. SMELTR
        DOES NOT WARRANT THAT THE PLATFORM WILL BE ERROR-FREE, THAT TRANSACTIONS WILL BE
        SUCCESSFULLY CONFIRMED ON THE SOLANA NETWORK, OR THAT THE SOLANA NETWORK WILL OPERATE
        WITHOUT INTERRUPTION OR DEGRADATION.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SMELTR TECHNOLOGIES LLC, ITS MEMBERS,
        OFFICERS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
        SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF TOKENS, LOSS OF FUNDS, LOSS
        OF DATA, OR LOSS OF PROFITS, ARISING OUT OF OR RELATED TO YOUR USE OF THE PLATFORM, EVEN IF
        ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
      </p>
      <p>
        SMELTR&apos;S TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF
        THE PLATFORM SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO SMELTR IN THE 12
        MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100 USD).
      </p>
      <p>
        SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IN SUCH
        JURISDICTIONS, OUR LIABILITY IS LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless Smeltr Technologies LLC and its members,
        officers, employees, and agents from and against any claims, liabilities, damages, losses,
        and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a)
        your use of the Platform; (b) your violation of these Terms; (c) your deployment of any
        token; (d) your use of the Permanent Delegate or any other extension authority; or (e)
        your violation of any applicable law or the rights of any third party.
      </p>

      <h2>12. Third-Party Services</h2>
      <p>
        The Platform integrates with third-party services including Stripe (payment processing),
        Irys/Arweave (metadata storage), Solana RPC providers, and wallet adapters. Your use of
        these services is subject to their respective terms of service and privacy policies. Smeltr
        is not responsible for the availability, accuracy, or conduct of any third-party service.
      </p>

      <h2>13. Modifications to Terms</h2>
      <p>
        Smeltr reserves the right to modify these Terms at any time. We will provide notice of
        material changes by posting updated Terms on the Platform and updating the &quot;Last
        Updated&quot; date. Your continued use of the Platform after the effective date of any
        modification constitutes your acceptance of the modified Terms.
      </p>

      <h2>14. Termination</h2>
      <p>
        Smeltr may suspend or terminate your access to the Platform at any time, with or without
        cause, with or without notice. Upon termination, your right to use the Platform ceases
        immediately. Sections 3, 4, 7, 8, 9, 10, 11, 15, and 16 survive termination.
      </p>

      <h2>15. Governing Law and Dispute Resolution</h2>
      <p>
        These Terms are governed by the laws of the State of Arizona, United States, without regard
        to its conflict of law provisions. Any dispute arising from these Terms or your use of the
        Platform shall be resolved exclusively in the state or federal courts located in Maricopa
        County, Arizona. You consent to the personal jurisdiction of such courts.
      </p>

      <h2>16. General Provisions</h2>
      <p>
        16.1 <strong>Entire Agreement.</strong> These Terms, together with the{" "}
        <a href="/privacy">Privacy Policy</a> and any additional terms applicable to specific
        features, constitute the entire agreement between you and Smeltr regarding the Platform.
      </p>
      <p>
        16.2 <strong>Severability.</strong> If any provision of these Terms is found
        unenforceable, the remaining provisions remain in full force and effect.
      </p>
      <p>
        16.3 <strong>Waiver.</strong> Smeltr&apos;s failure to enforce any provision of these Terms
        shall not constitute a waiver of that provision.
      </p>
      <p>
        16.4 <strong>Assignment.</strong> You may not assign your rights under these Terms without
        Smeltr&apos;s prior written consent. Smeltr may assign its rights without restriction.
      </p>

      <h2>17. Contact</h2>
      <p>
        Smeltr Technologies LLC (Arizona, USA)
        <br />
        legal@smeltr.org
      </p>
    </LegalShell>
  );
}

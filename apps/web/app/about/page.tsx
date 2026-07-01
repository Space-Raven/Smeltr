import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Smeltr",
  description:
    "Smeltr is non-custodial Token-2022 deployment infrastructure, built on the belief that Web3 tooling should be honest, unintimidating, and useful.",
};

export default function AboutPage() {
  return (
    <div
      className="text-white"
      style={{ background: "linear-gradient(135deg, #1A0C05 0%, #2D1507 60%, #3D1F08 100%)" }}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ color: "#FEF3C7" }}>
          About Smeltr
        </h1>
        <p className="text-lg mb-14" style={{ color: "#D97706" }}>
          A forge, not a casino.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "#F59E0B" }}>
            What we build
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: "#FDE68A" }}>
            Smeltr is non-custodial deployment infrastructure for Solana&apos;s Token-2022
            standard. Developers, founders, and businesses use it to configure and launch tokens —
            transfer fees, soul-bound credentials, permanent delegates — without writing custom
            code. We build the transaction instructions; your wallet signs them. That division of
            labor is absolute: Smeltr never holds your keys, your funds, or any authority over the
            tokens you create.
          </p>
          <p className="leading-relaxed" style={{ color: "#FDE68A" }}>
            The check that enforces this isn&apos;t a promise in a marketing page — it&apos;s code
            you can read. Every authority field in every module is validated against a denylist of
            platform-controlled addresses before a single instruction is constructed, and that
            source is public in our repository.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "#F59E0B" }}>
            What we believe
          </h2>
          <div className="space-y-6">
            <div className="rounded-xl p-5 border" style={{ background: "rgba(245,158,11,0.06)", borderColor: "#92400E" }}>
              <h3 className="font-semibold mb-1.5" style={{ color: "#FCD34D" }}>
                The technology matters more than the mania
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#FDE68A" }}>
                We believe in the technology underpinning Web3 — not as a get-rich-quick scheme or
                a short-term flip, but as a growing pillar of e-commerce, electronic media, and
                digital art. Tokens are programmable ownership. That&apos;s worth building
                carefully.
              </p>
            </div>
            <div className="rounded-xl p-5 border" style={{ background: "rgba(245,158,11,0.06)", borderColor: "#92400E" }}>
              <h3 className="font-semibold mb-1.5" style={{ color: "#FCD34D" }}>
                Legitimate development, not gambling
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#FDE68A" }}>
                Smeltr exists to make serious token development accessible — credentials,
                memberships, revenue mechanics, community infrastructure. Our terms prohibit
                deceptive launches, and our tooling is designed to make what a token can and
                cannot do transparent to everyone who holds it.
              </p>
            </div>
            <div className="rounded-xl p-5 border" style={{ background: "rgba(245,158,11,0.06)", borderColor: "#92400E" }}>
              <h3 className="font-semibold mb-1.5" style={{ color: "#FCD34D" }}>
                Onboarding should be fun, not frightening
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#FDE68A" }}>
                Most people&apos;s first contact with Web3 is intimidating by design — jargon,
                warnings, and interfaces built for insiders. We think onboarding newcomers should
                be fun, unintimidating, and educational, and every page we design is measured
                against that standard.
              </p>
            </div>
            <div className="rounded-xl p-5 border" style={{ background: "rgba(245,158,11,0.06)", borderColor: "#92400E" }}>
              <h3 className="font-semibold mb-1.5" style={{ color: "#FCD34D" }}>
                Honest infrastructure
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#FDE68A" }}>
                Fees are shown before you sign, never hidden inside a transaction. Progress
                indicators reflect real work, not theater. If a feature hasn&apos;t shipped, we
                don&apos;t sell it. Enterprise software earns trust by being boringly truthful.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "#F59E0B" }}>
            The forge
          </h2>
          <p className="leading-relaxed" style={{ color: "#FDE68A" }}>
            The name comes from smelting — taking raw material and refining it into something
            useful. That&apos;s the product philosophy in one image: raw Token-2022 primitives in,
            a well-formed token out, with the craftsman (you) holding the hammer the whole time.
            If you spot a tortoiseshell cat around the workshop, that&apos;s Pjorg, our forge
            keeper. She minds the furnace.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "#F59E0B" }}>
            The company
          </h2>
          <p className="leading-relaxed" style={{ color: "#FDE68A" }}>
            Smeltr Technologies LLC is an Arizona-based software company. We are not an exchange,
            a custodian, a broker, or a financial advisor — we make developer tooling, and our
            revenue comes from a transparent per-deployment fee and the Smeltr+ subscription.
            Questions, ideas, or just want to talk tokens? Write to{" "}
            <a href="mailto:pjorg@smeltr.org" className="underline" style={{ color: "#F59E0B" }}>
              pjorg@smeltr.org
            </a>
            .
          </p>
        </section>

        <div className="flex gap-4">
          <a
            href="/deploy"
            className="inline-flex items-center justify-center rounded-xl font-bold px-6 py-3 text-sm transition-colors"
            style={{ background: "#F59E0B", color: "#1A0C05" }}
          >
            Visit the forge →
          </a>
          <a
            href="/blog"
            className="inline-flex items-center justify-center rounded-xl border font-semibold px-6 py-3 text-sm"
            style={{ borderColor: "#92400E", color: "#FCD34D" }}
          >
            Read the guides
          </a>
        </div>
      </div>
    </div>
  );
}

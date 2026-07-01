export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #1A0C05 0%, #2D1507 50%, #3D1F08 100%)" }}>
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(#F59E0B 1px, transparent 1px), linear-gradient(to right, #F59E0B 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: "#F59E0B" }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-48 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: "#B45309" }} />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm mb-8" style={{ borderColor: "#92400E", background: "rgba(245,158,11,0.1)", color: "#FCD34D" }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Token-2022 · Non-custodial · Two signatures
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6" style={{ color: "#FEF3C7" }}>
              Deploy Solana tokens{" "}
              <span style={{ color: "#F59E0B" }}>without writing code</span>
            </h1>

            <p className="text-lg sm:text-xl mb-10 max-w-xl leading-relaxed" style={{ color: "#D97706" }}>
              Compose Token-2022 extension modules — transfer fees, soulbound locks,
              permanent delegates — and deploy in two wallet clicks. Your keys, your token.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/deploy"
                className="inline-flex items-center justify-center rounded-xl font-bold px-8 py-3.5 text-base transition-colors shadow-lg"
                style={{ background: "#F59E0B", color: "#1A0C05" }}
              >
                Launch Token →
              </a>
              <a
                href="#smeltr-plus"
                className="inline-flex items-center justify-center rounded-xl border font-semibold px-8 py-3.5 text-base transition-colors"
                style={{ borderColor: "#92400E", color: "#FCD34D", background: "rgba(255,255,255,0.05)" }}
              >
                Smeltr+ — $19/mo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Module cards ────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "#1A0C05" }}>Composable extension modules</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Each module wraps an extension of the independently audited SPL Token-2022 program. Mix and match —
              compatibility is checked before you sign anything.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ModuleCard
              emoji="⚡"
              name="Transfer Fee"
              description="Collect a basis-point fee on every token transfer. Fee is withheld in the recipient token account until harvested by the withdraw authority."
              tag="Revenue"
              tagColor="amber"
            />
            <ModuleCard
              emoji="🔒"
              name="Non-Transferable"
              description="Soul-bound tokens that can never leave the original account. Ideal for credentials, memberships, and reputation tokens."
              tag="Soulbound"
              tagColor="orange"
            />
            <ModuleCard
              emoji="⚠️"
              name="Permanent Delegate"
              description="Designate an authority with permanent transfer and burn rights over all holders. Irrevocable — requires explicit acknowledgment."
              tag="High-impact"
              tagColor="red"
            />
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "#FEF3C7" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: "#1A0C05" }}>How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Choose modules", body: "Pick the Token-2022 extensions you need. Compatibility is checked automatically." },
              { step: "02", title: "Add metadata", body: "Upload a name, symbol, and image. Stored permanently on Arweave via Irys." },
              { step: "03", title: "Review & sign", body: "Review the plan and estimated rent cost, then sign transaction 1 in your wallet." },
              { step: "04", title: "Attach metadata", body: "A second wallet signature attaches on-chain metadata. Token visible in all wallets." },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-3">
                <span className="text-4xl font-black leading-none" style={{ color: "#F59E0B", opacity: 0.5 }}>{step}</span>
                <h3 className="text-base font-semibold" style={{ color: "#1A0C05" }}>{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Smeltr+ ─────────────────────────────────────────────────────── */}
      <section id="smeltr-plus" className="py-20" style={{ background: "#1A0C05" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-4" style={{ background: "#92400E", color: "#FCD34D" }}>
              ★ Smeltr+
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "#FEF3C7" }}>
              Deploy faster. Skip the funding step.
            </h2>
            <p className="leading-relaxed" style={{ color: "#D97706" }}>
              Premium subscribers skip the Irys wallet-funding transaction entirely.
              The platform covers Arweave storage costs — your metadata is uploaded
              with no extra wallet prompts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
            {[
              {
                title: "Platform-funded uploads",
                body: "Metadata and images go straight to Arweave. No separate funding transaction, no SOL required for storage.",
              },
              {
                title: "Larger uploads",
                body: "Free deployments cover compact metadata; Smeltr+ raises the storage limits for bigger images and richer token pages.",
              },
              {
                title: "Early access to new modules",
                body: "Transfer Hook, Interest-Bearing, Confidential Transfers — premium subscribers get new modules first as they ship.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-xl p-5 border" style={{ background: "rgba(245,158,11,0.06)", borderColor: "#92400E" }}>
                <h3 className="font-semibold mb-1.5 text-sm" style={{ color: "#F59E0B" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#92400E" }}>{body}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-1 mb-6">
              <span className="text-5xl font-black" style={{ color: "#F59E0B" }}>$19</span>
              <span className="text-sm" style={{ color: "#B45309" }}>per month · cancel anytime</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl font-bold px-8 py-3.5 text-base transition-colors"
                style={{ background: "#F59E0B", color: "#1A0C05" }}
              >
                Get Smeltr+ →
              </a>
              <a
                href="/deploy"
                className="inline-flex items-center justify-center rounded-xl border font-semibold px-8 py-3.5 text-base transition-colors"
                style={{ borderColor: "#78350F", color: "#D97706" }}
              >
                Deploy free first
              </a>
            </div>
            <p className="mt-4 text-xs" style={{ color: "#78350F" }}>
              Sign in with your wallet on the dashboard to upgrade. No KYC, no email required.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA strip ───────────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: "#92400E" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "#FEF3C7" }}>Ready to mint?</h2>
          <p className="mb-8" style={{ color: "#FCD34D" }}>
            No account required. Connect your wallet and deploy in under two minutes.
          </p>
          <a
            href="/deploy"
            className="inline-flex items-center gap-2 rounded-xl font-bold px-8 py-3.5 text-base transition-colors"
            style={{ background: "#1A0C05", color: "#F59E0B" }}
          >
            Deploy a token →
          </a>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({
  emoji,
  name,
  description,
  tag,
  tagColor,
}: {
  emoji: string;
  name: string;
  description: string;
  tag: string;
  tagColor: "amber" | "orange" | "red";
}) {
  const tagClasses = {
    amber: "bg-amber-100 text-amber-800",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <div className="rounded-xl border border-amber-100 bg-white p-6 hover:border-amber-300 hover:shadow-md transition-all">
      <span className="text-3xl mb-4 block">{emoji}</span>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-gray-900">{name}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagClasses[tagColor]}`}>
          {tag}
        </span>
      </div>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

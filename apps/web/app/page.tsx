export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(#818CF8 1px, transparent 1px), linear-gradient(to right, #818CF8 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-48 bg-violet-500 rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-200 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Token-2022 · Non-custodial · Devnet &amp; Mainnet
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance mb-6">
              Deploy Solana tokens{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-indigo-300">
                without writing code
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-indigo-200 mb-10 max-w-xl leading-relaxed">
              Compose Token-2022 extension modules — transfer fees, non-transferable locks,
              permanent delegates — and deploy in two wallet clicks. Your keys, your token.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/deploy"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-emerald-950 font-bold px-8 py-3.5 text-base transition-colors shadow-lg shadow-emerald-900/30"
              >
                Launch Token →
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-3.5 text-base transition-colors"
              >
                My Tokens
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Module cards */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Composable extension modules</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Each module wraps a pre-audited Token-2022 extension configuration.
              Mix and match — compatibility is checked before you sign anything.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ModuleCard
              icon="/icons/module-transfer-fee.svg"
              name="Transfer Fee"
              description="Collect a basis-point fee on every token transfer. Fee is held in the token account until harvested."
              tag="Revenue"
              tagColor="indigo"
            />
            <ModuleCard
              icon="/icons/module-non-transferable.svg"
              name="Non-Transferable"
              description="Soul-bound tokens that can never leave the original account. Perfect for credentials and loyalty."
              tag="Soulbound"
              tagColor="orange"
            />
            <ModuleCard
              icon="/icons/module-permanent-delegate.svg"
              name="Permanent Delegate"
              description="Designate an authority that can transfer or burn tokens from any holder's account."
              tag="High-impact"
              tagColor="red"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Choose modules", body: "Pick the Token-2022 extensions you need from the module library." },
              { step: "02", title: "Add metadata", body: "Upload a name, symbol, and image. Stored on Arweave via Irys." },
              { step: "03", title: "Review & sign", body: "Review the deployment plan and rent cost, then sign transaction 1 in your wallet." },
              { step: "04", title: "Attach metadata", body: "A second wallet signature attaches your on-chain metadata. Done." },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-3">
                <span className="text-4xl font-black text-indigo-100 leading-none">{step}</span>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-indigo-600 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to mint?</h2>
          <p className="text-indigo-200 mb-8">
            No account required. Connect your wallet and deploy in under two minutes.
          </p>
          <a
            href="/deploy"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8 py-3.5 text-base transition-colors shadow-lg shadow-indigo-900/20"
          >
            Deploy a token →
          </a>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({
  icon,
  name,
  description,
  tag,
  tagColor,
}: {
  icon: string;
  name: string;
  description: string;
  tag: string;
  tagColor: "indigo" | "orange" | "red";
}) {
  const tagClasses = {
    indigo: "bg-indigo-100 text-indigo-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition-all">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" width={44} height={44} className="mb-4" />
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

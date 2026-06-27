import type { Metadata } from "next";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletProviders } from "@/components/WalletProviders";
import { WalletButton } from "@/components/WalletButton";

const SITE_URL = "https://smeltr.org";
const SITE_NAME = "Smeltr";
const SITE_DESCRIPTION =
  "Deploy Solana Token-2022 tokens without writing code. Transfer fees, soul-bound locks, permanent delegate — composable, non-custodial, two wallet clicks.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Non-Custodial Token-2022 Launcher`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "solana token",
    "token-2022",
    "spl token",
    "deploy solana token",
    "transfer fee token",
    "non-transferable token",
    "soulbound token solana",
    "permanent delegate",
    "token launcher",
    "solana no-code",
    "non-custodial token",
  ],
  authors: [{ name: "Smeltr" }],
  creator: "Smeltr",
  publisher: "Smeltr",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Deploy Solana Token-2022 tokens without writing code`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Smeltr — Non-Custodial Token-2022 Launcher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Deploy Solana Token-2022 tokens without writing code`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.svg"],
    creator: "@smeltrapp",
    site: "@smeltrapp",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Smeltr",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier — self-funded Arweave uploads",
  },
  featureList: [
    "Token-2022 Transfer Fee extension",
    "Non-Transferable (soul-bound) extension",
    "Permanent Delegate extension",
    "On-chain metadata via Irys/Arweave",
    "Non-custodial — user wallet signs all transactions",
    "No account required",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <WalletProviders>
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </WalletProviders>
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 no-underline group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.svg"
              alt=""
              width={32}
              height={32}
              className="transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-lg font-bold tracking-tight text-indigo-950">Smeltr</span>
          </a>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="/deploy" className="hover:text-indigo-600 transition-colors">Deploy</a>
            <a href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</a>
            <a href="/blog" className="hover:text-indigo-600 transition-colors">Blog</a>
            <a
              href="https://github.com/smeltrapp"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              GitHub ↗
            </a>
          </nav>

          <div className="flex items-center gap-3">
              <WalletButton />
            </div>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white py-10 mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.svg" alt="Smeltr" width={22} height={22} />
              <span className="font-bold text-indigo-950">Smeltr</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Non-custodial Token-2022 deployment. Your keys, your token.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Product</p>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <a href="/deploy" className="hover:text-indigo-600 transition-colors no-underline">Deploy a token</a>
              <a href="/dashboard" className="hover:text-indigo-600 transition-colors no-underline">Dashboard</a>
              <a href="/blog" className="hover:text-indigo-600 transition-colors no-underline">Blog</a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Extensions</p>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <a href="/blog/how-to-deploy-solana-token-2022-transfer-fee" className="hover:text-indigo-600 transition-colors no-underline">Transfer Fee</a>
              <a href="/blog/solana-soulbound-token-non-transferable-extension" className="hover:text-indigo-600 transition-colors no-underline">Non-Transferable</a>
              <a href="/blog/permanent-delegate-token-2022-explained" className="hover:text-indigo-600 transition-colors no-underline">Permanent Delegate</a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Community</p>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <a href="https://twitter.com/smeltrapp" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors no-underline">Twitter / X ↗</a>
              <a href="https://discord.gg/smeltr" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors no-underline">Discord ↗</a>
              <a href="https://github.com/smeltrapp" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors no-underline">GitHub ↗</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>© 2026 Smeltr. Non-custodial infrastructure. Built on Solana Token-2022.</span>
          <span>Not financial advice. Always verify transaction details before signing.</sp
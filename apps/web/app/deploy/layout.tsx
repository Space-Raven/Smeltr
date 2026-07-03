import type { Metadata } from "next";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Deploy a Solana Token-2022 Token",
  description:
    "No-code Token-2022 deployment on Solana mainnet. Compose transfer fee, soulbound, and permanent delegate modules. Non-custodial — your wallet signs every transaction.",
  keywords: [
    "deploy solana token",
    "create spl token",
    "token-2022 deploy",
    "solana token launcher",
    "no code solana token",
  ],
  alternates: { canonical: `${SITE_URL}/deploy` },
  openGraph: {
    url: `${SITE_URL}/deploy`,
    title: "Deploy Token-2022 — Smeltr",
    description:
      "Compose Token-2022 extension modules and deploy on Solana. Non-custodial, schema-validated.",
    images: [{ ...OG_IMAGE }],
  },
};

export default function DeployLayout({ children }: { children: React.ReactNode }) {
  return children;
}

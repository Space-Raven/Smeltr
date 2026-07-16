import { Connection, PublicKey } from "@solana/web3.js";
import {
  ExtensionType,
  getExtensionData,
  getMetadataPointerState,
  getMintCloseAuthority,
  getNonTransferable,
  getPermanentDelegate,
  getTransferFeeConfig,
  unpackMint,
} from "@solana/spl-token";
import { unpack as unpackTokenMetadata } from "@solana/spl-token-metadata";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "./verifyDeployment";
import type { MintFacts } from "./fairLaunch";
import { trustedImageUrl } from "./fairLaunch";

/**
 * On-chain fetcher for the Fair-Launch Check (Phase B result layer).
 * Read-only: one getAccountInfo per mint, interpreted into MintFacts.
 * Interpretation logic stays in fairLaunch.ts (pure, unit-tested).
 */

const DEVNET_FALLBACK = "https://api.devnet.solana.com";

/**
 * Server-side RPC: prefer the platform endpoint (PLATFORM_RPC_URL) so public
 * token pages don't spend the client-facing quota; fall back to the public
 * client URL, then devnet in dev only.
 */
export function resolveServerRpcUrl(): string {
  const platform = process.env.PLATFORM_RPC_URL?.trim();
  if (platform) return platform;
  const client = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (client) return client;
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  if (isProd) {
    throw new Error("No server RPC URL configured (PLATFORM_RPC_URL or NEXT_PUBLIC_SOLANA_RPC_URL).");
  }
  return DEVNET_FALLBACK;
}

/** TLV "no authority" is the all-zeros pubkey — normalize it to null. */
function nonZeroBase58(pk: PublicKey | null | undefined): string | null {
  if (!pk || pk.equals(PublicKey.default)) return null;
  return pk.toBase58();
}

export async function fetchMintFacts(mintAddress: string): Promise<MintFacts | null> {
  const connection = new Connection(resolveServerRpcUrl(), "confirmed");
  const mintPubkey = new PublicKey(mintAddress);

  const info = await connection.getAccountInfo(mintPubkey);
  if (!info) return null;

  const owner = info.owner.toBase58();
  const isToken2022 = owner === TOKEN_2022_PROGRAM_ID;
  if (!isToken2022 && owner !== TOKEN_PROGRAM_ID) return null; // not a mint

  const mint = unpackMint(mintPubkey, info, info.owner);

  let metadata: MintFacts["metadata"] = null;
  if (isToken2022 && getMetadataPointerState(mint)?.metadataAddress?.equals(mintPubkey)) {
    const data = getExtensionData(ExtensionType.TokenMetadata, mint.tlvData);
    if (data) {
      const tm = unpackTokenMetadata(data);
      metadata = {
        name: tm.name,
        symbol: tm.symbol,
        uri: tm.uri,
        updateAuthority: tm.updateAuthority?.toBase58() ?? null,
      };
    }
  }

  const transferFee = isToken2022 ? getTransferFeeConfig(mint) : null;

  return {
    mintAddress,
    tokenStandard: isToken2022 ? "token-2022" : "spl-legacy",
    supply: mint.supply,
    decimals: mint.decimals,
    mintAuthority: mint.mintAuthority?.toBase58() ?? null,
    freezeAuthority: mint.freezeAuthority?.toBase58() ?? null,
    permanentDelegate: isToken2022
      ? nonZeroBase58(getPermanentDelegate(mint)?.delegate)
      : null,
    transferFeeBps: transferFee ? transferFee.newerTransferFee.transferFeeBasisPoints : null,
    nonTransferable: isToken2022 ? getNonTransferable(mint) !== null : false,
    mintCloseAuthority: isToken2022
      ? nonZeroBase58(getMintCloseAuthority(mint)?.closeAuthority)
      : null,
    metadata,
  };
}

/**
 * Resolve the token's logo from its metadata JSON. Fetches only from hosts we
 * already trust for images (Arweave/Irys — where Smeltr uploads land); any
 * other host is skipped rather than proxied (no SSRF surface on a public page).
 */
export async function fetchTokenImage(uri: string | undefined | null): Promise<string | null> {
  const jsonUrl = trustedImageUrl(uri ?? null);
  if (!jsonUrl) return null;
  try {
    const res = await fetch(jsonUrl, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { image?: unknown };
    return trustedImageUrl(typeof json.image === "string" ? json.image : null);
  } catch {
    return null;
  }
}

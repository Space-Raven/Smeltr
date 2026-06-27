"use client";
import { useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WebUploader } from "@irys/web-upload";
import { WebSolana } from "@irys/web-upload-solana";

const FREE_UPLOAD_THRESHOLD_BYTES = 100 * 1024; // Irys documented free tier (~100 KiB)

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

// True when the configured RPC points at mainnet-beta.
// Drives Irys bundler selection and gateway URL.
const IS_MAINNET =
  RPC_URL.includes("mainnet") || RPC_URL.includes("solana-mainnet");

// Irys gateway base URL -- devnet uploads land on a separate gateway.
//   mainnet: https://gateway.irys.xyz/{id}
//   devnet:  https://devnet.irys.xyz/{id}
const IRYS_GATEWAY = IS_MAINNET
  ? "https://gateway.irys.xyz"
  : "https://devnet.irys.xyz";

interface IrysUploadResult {
  uri: string;
  fundedExtra: boolean;
}

/**
 * Lazily creates and caches a WebUploader(WebSolana) instance bound to the
 * connected wallet.
 *
 * Network selection:
 *   - Reads NEXT_PUBLIC_SOLANA_RPC_URL to determine mainnet vs devnet.
 *   - On devnet: chains .withRpc(RPC_URL).devnet() so the uploader targets
 *     the devnet Irys bundler and uses the wallet's devnet SOL balance.
 *   - On mainnet: standard .withProvider(wallet) with no extra flags.
 *
 * Method names verified against installed @irys/upload-core types.
 * Note: uploadData() was the deprecated Bundlr-era name; current API uses upload().
 *
 * Image compression (see lib/imageCompression.ts) keeps uploads under
 * FREE_UPLOAD_THRESHOLD_BYTES to avoid triggering a funding transaction
 * for typical token images.
 */
export function useIrysUpload() {
  const wallet = useWallet();
  const uploaderRef = useRef<Awaited<ReturnType<typeof WebUploader>> | null>(null);
  // Track which wallet was used to build the cached uploader so we reset if
  // the user switches accounts.
  const uploaderWalletRef = useRef<string | null>(null);

  const getUploader = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error("Connect your wallet before uploading.");
    }

    const currentPubkey = wallet.publicKey.toBase58();

    // Reset cached instance if wallet changed
    if (uploaderWalletRef.current !== currentPubkey) {
      uploaderRef.current = null;
      uploaderWalletRef.current = currentPubkey;
    }

    if (!uploaderRef.current) {
      if (IS_MAINNET) {
        uploaderRef.current = await WebUploader(WebSolana).withProvider(wallet);
      } else {
        // devnet: point uploader at devnet bundler + use the app's RPC endpoint
        uploaderRef.current = await WebUploader(WebSolana)
          .withProvider(wallet)
          .withRpc(RPC_URL)
          .devnet();
      }
    }

    return uploaderRef.current;
  }, [wallet]);

  /**
   * Uploads raw bytes to Irys/Arweave.
   *
   * If the payload exceeds the free tier and the wallet's Irys balance is
   * insufficient, this triggers a SOL-funding transaction -- a SEPARATE wallet
   * signature from any mint/metadata transactions. Callers should warn the
   * user before uploading large payloads.
   *
   * Image upload and JSON upload are independently retryable: Arweave data
   * is permanent so we never re-upload on retry if we already have a URI.
   */
  const upload = useCallback(
    async (data: Uint8Array, contentType: string): Promise<IrysUploadResult> => {
      const irys = await getUploader();
      let fundedExtra = false;

      if (data.byteLength > FREE_UPLOAD_THRESHOLD_BYTES) {
        const price = await irys.getPrice(data.byteLength);
        const balance = await irys.getBalance();
        if (price.isGreaterThan(balance)) {
          await irys.fund(price.minus(balance));
          fundedExtra = true;
        }
      }

      // Irys upload() expects Buffer | string | Readable -- convert from Uint8Array
      const receipt = await irys.upload(Buffer.from(data), {
        tags: [{ name: "Content-Type", value: contentType }],
      });

      return {
        uri: `${IRYS_GATEWAY}/${receipt.id}`,
        fundedExtra,
      };
    },
    [getUploader]
  );

  return { upload, isMainnet: IS_MAINNET, gateway: IRYS_GATEWAY };
}

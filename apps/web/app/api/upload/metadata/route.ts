import { NextResponse } from "next/server";
import { WebUploader } from "@irys/web-upload";
import { WebSolana } from "@irys/web-upload-solana";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { getSessionWallet } from "../../../../lib/session";
import { isPremium } from "../../../../lib/subscription";

/**
 * POST /api/upload/metadata
 *
 * Platform-funded Irys upload endpoint for premium subscribers.
 *
 * The platform wallet (PLATFORM_IRYS_PRIVATE_KEY) pays for Arweave storage
 * instead of the user's wallet. Free-tier users use the client-side
 * wallet-funded path in useIrysUpload.ts instead.
 *
 * Request body (multipart/form-data):
 *   file    — binary blob (image or JSON)
 *   type    — MIME type string (e.g. "image/png", "application/json")
 *
 * Response:
 *   { uri }  — permanent Arweave gateway URL
 *
 * Security:
 *   - Requires SIWS session (wallet from cookie, never request body)
 *   - Requires active Stripe subscription (isPremium check)
 *   - File size capped at 5MB server-side (Irys free tier is 100KB; premium
 *     users pay via platform wallet for larger files, but 5MB is a sane cap)
 *   - The platform private key is server-side only — never exposed to the client
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB hard cap

// Lazy-initialised uploader so cold starts don't hit Irys if keys aren't set.
let _uploader: Awaited<ReturnType<typeof WebUploader>> | null = null;

async function getPlatformUploader() {
  if (_uploader) return _uploader;

  const privateKeyB58 = process.env.PLATFORM_IRYS_PRIVATE_KEY;
  if (!privateKeyB58) throw new Error("PLATFORM_IRYS_PRIVATE_KEY is not set");

  const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyB58));

  // Minimal wallet-adapter-compatible shim for the platform keypair.
  // Irys only needs signTransaction and publicKey for server-side uploads.
  const walletShim = {
    publicKey: keypair.publicKey,
    signTransaction: async <T>(tx: T) => tx, // unused for funded uploads
    signMessage: async (msg: Uint8Array) => {
      const { sign } = await import("tweetnacl");
      return sign.detached(msg, keypair.secretKey);
    },
  };

  const IS_MAINNET =
    (process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "").includes("mainnet") ||
    (process.env.PLATFORM_RPC_URL ?? "").includes("mainnet");

  if (IS_MAINNET) {
    _uploader = await WebUploader(WebSolana).withProvider(walletShim as any);
  } else {
    const rpcUrl =
      process.env.PLATFORM_RPC_URL ??
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
      "https://api.devnet.solana.com";
    _uploader = await WebUploader(WebSolana)
      .withProvider(walletShim as any)
      .withRpc(rpcUrl)
      .devnet();
  }

  return _uploader;
}

export async function POST(req: Request) {
  // --- Auth: SIWS session required ------------------------------------------
  const walletAddress = await getSessionWallet(req);
  if (!walletAddress) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // --- Auth: active subscription required -----------------------------------
  const premium = await isPremium(walletAddress);
  if (!premium) {
    return NextResponse.json(
      { error: "Premium subscription required for platform-funded uploads" },
      { status: 403 }
    );
  }

  // --- Parse multipart form --------------------------------------------------
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const contentType = formData.get("type");

  if (!(file instanceof Blob) || typeof contentType !== "string") {
    return NextResponse.json(
      { error: "Required fields: file (Blob), type (string)" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_FILE_BYTES / 1024 / 1024}MB limit` },
      { status: 413 }
    );
  }

  // --- Upload via platform wallet -------------------------------------------
  try {
    const uploader = await getPlatformUploader();
    const bytes = new Uint8Array(await file.arrayBuffer());

    const receipt = await uploader.upload(Buffer.from(bytes), {
      tags: [{ name: "Content-Type", value: contentType }],
    });

    const IS_MAINNET =
      (process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "").includes("mainnet") ||
      (process.env.PLATFORM_RPC_URL ?? "").includes("mainnet");

    const gateway = IS_MAINNET
      ? "https://gateway.irys.xyz"
      : "https://devnet.irys.xyz";

    return NextResponse.json({ uri: `${gateway}/${receipt.id}` });
  } catch (err) {
    console.error("[upload/metadata] Irys upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed — platform storage unavailable" },
      { status: 502 }
    );
  }
}

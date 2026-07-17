import { NextResponse } from "next/server";
import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";
import { getSessionWallet } from "../../../../lib/session";
import { isPremium } from "../../../../lib/subscription";
import { reserveQuota, refundQuota } from "../../../../lib/uploadQuota";
import { resolveIrysNetwork } from "../../../../lib/irysNetwork";
import {
  MAX_METADATA_JSON_BYTES,
  validateTokenMetadataJson,
} from "../../../../lib/tokenMetadataJson";

// The Irys Node SDK pulls native/CJS deps that must run in the Node runtime,
// never Edge.
export const runtime = "nodejs";

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

// Only token-metadata content is platform-funded. Without this allowlist a
// premium session could publish arbitrary permanent content (e.g. text/html
// phishing pages) to Arweave at the platform's expense, under our funding
// wallet's name.
// The client always uploads image/webp (imageCompression.ts) or JSON; png/jpeg
// are kept as headroom. SVG is deliberately excluded (can embed scripts).
const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/json",
]);

// Lazy-initialised uploader so cold starts don't hit Irys if keys aren't set.
// Uses the Irys NODE SDK (@irys/upload) — the previous implementation drove the
// browser SDK with a hand-rolled wallet shim server-side (engineering roadmap
// 1E), which was fragile in the serverless runtime. The Node builder takes the
// base58 secret key directly.
let _uploader: Awaited<ReturnType<ReturnType<typeof Uploader>["build"]>> | null = null;

async function getPlatformUploader() {
  if (_uploader) return _uploader;

  const privateKeyB58 = process.env.PLATFORM_IRYS_PRIVATE_KEY;
  if (!privateKeyB58) throw new Error("PLATFORM_IRYS_PRIVATE_KEY is not set");

  const net = resolveIrysNetwork({
    platformRpcUrl: process.env.PLATFORM_RPC_URL,
    publicRpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  });

  const builder = Uploader(Solana).withWallet(privateKeyB58);
  _uploader = net.mainnet
    ? await builder.build()
    : await builder.withRpc(net.rpcUrl).devnet().build();

  return _uploader;
}

export async function POST(req: Request) {
  // --- Auth: SIWS session required ------------------------------------------
  const walletAddress = await getSessionWallet();
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

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Unsupported content type — token metadata uploads accept images and JSON only." },
      { status: 415 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_FILE_BYTES / 1024 / 1024}MB limit` },
      { status: 413 }
    );
  }

  // Audit-2 Low-1: JSON uploads must BE token metadata, with tight size and
  // field bounds — the platform pays to publish this permanently.
  if (contentType === "application/json") {
    if (file.size > MAX_METADATA_JSON_BYTES) {
      return NextResponse.json(
        { error: `Metadata JSON exceeds ${MAX_METADATA_JSON_BYTES / 1024}KB limit` },
        { status: 413 }
      );
    }
    const verdict = validateTokenMetadataJson(await file.text());
    if (verdict.ok === false) {
      return NextResponse.json({ error: verdict.reason }, { status: 422 });
    }
  }

  // --- Abuse control: per-wallet daily quota (TOB-04) -----------------------
  // Reserve quota BEFORE spending the platform balance. This caps both request
  // count and total bytes per wallet per UTC day, preventing a single session
  // (including a stolen/forged one) from draining platform storage funds.
  const reservation = await reserveQuota(walletAddress, file.size);
  if (reservation.ok === false) {
    return NextResponse.json({ error: reservation.reason }, { status: 429 });
  }

  // --- Upload via platform wallet -------------------------------------------
  try {
    const uploader = await getPlatformUploader();
    const bytes = new Uint8Array(await file.arrayBuffer());

    const receipt = await uploader.upload(Buffer.from(bytes), {
      tags: [{ name: "Content-Type", value: contentType }],
    });

    const { gatewayBase } = resolveIrysNetwork({
      platformRpcUrl: process.env.PLATFORM_RPC_URL,
      publicRpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    });

    return NextResponse.json({ uri: `${gatewayBase}/${receipt.id}` });
  } catch (err) {
    // The upload never happened, so don't count it against the wallet's quota.
    await refundQuota(walletAddress, file.size);
    console.error("[upload/metadata] Irys upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed — platform storage unavailable" },
      { status: 502 }
    );
  }
}

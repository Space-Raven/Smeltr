import { NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";
import { computeSweepLamports } from "../../../../lib/sweep";

/**
 * GET /api/ops/sweep-irys  (Vercel Cron, daily)
 *
 * Sweeps excess SOL from the hot Irys upload wallet to the Founder sink,
 * leaving a working reserve. Founder is the SOLE allowed destination — a
 * hard-coded invariant, so a bug or an unexpected invocation can never move
 * funds anywhere else. See project ops notes.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Requests
 * without it are rejected, so the endpoint can't be triggered by the public.
 *
 * Env:
 *   PLATFORM_IRYS_PRIVATE_KEY  base58 secret key of the hot Irys wallet (source)
 *   PLATFORM_FOUNDER_PUBKEY    base58 Founder pubkey (the ONLY sweep destination)
 *   CRON_SECRET                shared secret Vercel Cron presents as a bearer token
 *   PLATFORM_RPC_URL           RPC (falls back to NEXT_PUBLIC_SOLANA_RPC_URL / devnet)
 *   IRYS_SWEEP_RESERVE_SOL     SOL to keep for uploads (default 0.5)
 *   IRYS_SWEEP_MIN_SOL         min excess before sweeping, avoids dust (default 0.05)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE58_PUBKEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const FEE_BUFFER_LAMPORTS = 5000; // one signature's base fee, kept in the wallet

function solEnvToLamports(value: string | undefined, fallbackSol: number): number {
  const n = Number(value);
  const sol = Number.isFinite(n) && n >= 0 ? n : fallbackSol;
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

export async function GET(req: Request) {
  // --- Auth: bearer CRON_SECRET (Vercel Cron injects this) -----------------
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Config --------------------------------------------------------------
  const priv = process.env.PLATFORM_IRYS_PRIVATE_KEY;
  const founder = process.env.PLATFORM_FOUNDER_PUBKEY;
  if (!priv || !founder) {
    return NextResponse.json({ error: "Sweeper not configured (key/founder missing)" }, { status: 500 });
  }
  if (!BASE58_PUBKEY.test(founder)) {
    return NextResponse.json({ error: "PLATFORM_FOUNDER_PUBKEY is not a valid base58 pubkey" }, { status: 500 });
  }

  // The ONLY permitted destination. Constructed once, reused; never derived
  // from request input.
  const destination = new PublicKey(founder);

  let source: Keypair;
  try {
    source = Keypair.fromSecretKey(bs58.decode(priv));
  } catch {
    return NextResponse.json({ error: "PLATFORM_IRYS_PRIVATE_KEY is invalid" }, { status: 500 });
  }

  // Never sweep to self (would be a no-op that still burns a fee).
  if (source.publicKey.equals(destination)) {
    return NextResponse.json(
      { error: "Irys wallet equals Founder wallet; refusing to sweep." },
      { status: 500 }
    );
  }

  const rpc =
    process.env.PLATFORM_RPC_URL ??
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");

  let balance: number;
  try {
    balance = await connection.getBalance(source.publicKey);
  } catch {
    return NextResponse.json({ error: "Could not reach RPC to read balance" }, { status: 503 });
  }

  const plan = computeSweepLamports({
    balanceLamports: balance,
    reserveLamports: solEnvToLamports(process.env.IRYS_SWEEP_RESERVE_SOL, 0.5),
    feeLamports: FEE_BUFFER_LAMPORTS,
    minSweepLamports: solEnvToLamports(process.env.IRYS_SWEEP_MIN_SOL, 0.05),
  });

  if (!plan.sweep) {
    return NextResponse.json({
      swept: false,
      from: source.publicKey.toBase58(),
      balanceLamports: balance,
      reason: plan.reason,
    });
  }

  // --- Guard: destination must still be Founder (belt-and-suspenders) -------
  if (!destination.equals(new PublicKey(founder))) {
    return NextResponse.json({ error: "Destination allowlist violation" }, { status: 500 });
  }

  try {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: source.publicKey,
        toPubkey: destination,
        lamports: plan.lamports,
      })
    );
    const signature = await sendAndConfirmTransaction(connection, tx, [source]);

    return NextResponse.json({
      swept: true,
      from: source.publicKey.toBase58(),
      to: destination.toBase58(),
      lamports: plan.lamports,
      sol: plan.lamports / LAMPORTS_PER_SOL,
      signature,
    });
  } catch (err) {
    console.error("[ops/sweep-irys] transfer failed:", err);
    return NextResponse.json({ error: "Sweep transfer failed" }, { status: 502 });
  }
}

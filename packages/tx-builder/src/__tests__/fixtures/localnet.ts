/**
 * Anchor localnet test fixtures for Smeltr tx-builder tests.
 *
 * Usage:
 *   Start validator:  solana-test-validator --reset
 *   Run tests:        npm run test:registry -- --runInBand
 *
 * Fixtures provide:
 *   - Pre-funded payer keypair (10 SOL airdropped on first use)
 *   - Deterministic mint keypair (reproducible across runs)
 *   - Confirmed-tx helper wrapping sendAndConfirmTransaction
 *   - RPC connection pointed at localnet
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

export const LOCALNET_URL = process.env.SOLANA_TEST_RPC ?? "http://127.0.0.1:8899";

export function localnetConnection(): Connection {
  return new Connection(LOCALNET_URL, "confirmed");
}

// ---------------------------------------------------------------------------
// Keypairs
// ---------------------------------------------------------------------------

const FIXTURE_DIR = path.join(__dirname, ".cache");

function loadOrCreate(filename: string): Keypair {
  const filepath = path.join(FIXTURE_DIR, filename);
  if (fs.existsSync(filepath)) {
    const raw = JSON.parse(fs.readFileSync(filepath, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  }
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  const kp = Keypair.generate();
  fs.writeFileSync(filepath, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}

/** Persistent payer — funded once, reused across test runs. */
export function payerKeypair(): Keypair {
  return loadOrCreate("payer.json");
}

/** Fresh mint keypair — regenerated each test run for isolation. */
export function freshMintKeypair(): Keypair {
  return Keypair.generate();
}

// ---------------------------------------------------------------------------
// Airdrop helper
// ---------------------------------------------------------------------------

const MIN_BALANCE = 0.05 * LAMPORTS_PER_SOL; // test costs ~0.003 SOL; 0.05 is ample headroom

/** Wait for the validator to be reachable before issuing requests. */
async function waitForValidator(
  connection: Connection,
  retries = 20,
  delayMs = 1000
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      // Use a short per-attempt timeout so the fetch doesn't outlive the test
      // suite and trigger Jest's open handle warning.
      await Promise.race([
        connection.getSlot(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("getSlot timeout")), delayMs - 1)
        ),
      ]);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(`Validator at ${LOCALNET_URL} did not respond after ${retries}s`);
}

export async function ensureFunded(
  connection: Connection,
  keypair: Keypair,
  lamports = 2 * LAMPORTS_PER_SOL // 2 SOL: safe for both localnet and devnet (devnet airdrop cap)
): Promise<void> {
  await waitForValidator(connection);
  const balance = await connection.getBalance(keypair.publicKey);
  if (balance < MIN_BALANCE) {
    const sig = await connection.requestAirdrop(keypair.publicKey, lamports);
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );
  }
}

// ---------------------------------------------------------------------------
// Transaction helper
// ---------------------------------------------------------------------------

export async function sendAndConfirm(
  connection: Connection,
  tx: Transaction,
  signers: Keypair[]
): Promise<string> {
  const feePayer = signers[0];
  if (!feePayer) throw new Error("sendAndConfirm requires at least one signer");
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = feePayer.publicKey;
  return sendAndConfirmTransaction(connection, tx, signers, {
    commitment: "confirmed",
  });
}

// ---------------------------------------------------------------------------
// Jest lifecycle helpers
// ---------------------------------------------------------------------------

/**
 * Drop into a beforeAll block to wire up connection + funded payer.
 *
 * @example
 *   const ctx = setupLocalnet();
 *   it("deploys mint", async () => { ... ctx.connection ... ctx.payer ... });
 */
export function setupLocalnet() {
  const ctx: {
    connection: Connection;
    payer: Keypair;
  } = {} as any;

  beforeAll(async () => {
    ctx.connection = localnetConnection();
    ctx.payer = payerKeypair();
    await ensureFunded(ctx.connection, ctx.payer);
  }, 90_000); // 90s: covers validator cold-start + airdrop confirmation

  return ctx;
}

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

const VALIDATOR_START_HINT =
  "Start a local validator in another terminal:\n" +
  "  Windows: npm run validator:local:wsl\n" +
  "  Linux/macOS: npm run validator:local\n" +
  "  Or auto-start + test: npm run test:a2:integration\n" +
  "  Devnet (no validator): npm run test:a2:integration:devnet";

/** Race getSlot against a timeout; always clears the timer to avoid Jest open handles. */
async function getSlotWithTimeout(
  connection: Connection,
  timeoutMs: number
): Promise<number> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      connection.getSlot(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("getSlot timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Quick probe — returns false if nothing listens within maxWaitMs (default 3s). */
export async function isValidatorReachable(
  connection: Connection,
  maxWaitMs = 3000
): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    try {
      await getSlotWithTimeout(connection, 800);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return false;
}

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
  retries = 6,
  delayMs = 500
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await getSlotWithTimeout(connection, delayMs - 1);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(
    `Validator at ${LOCALNET_URL} did not respond after ~${Math.ceil((retries * delayMs) / 1000)}s.\n${VALIDATOR_START_HINT}`
  );
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
    /** False when integration tests should no-op (validator intentionally skipped). */
    available: boolean;
  } = { available: false } as any;

  beforeAll(async () => {
    ctx.connection = localnetConnection();

    if (process.env.SKIP_INTEGRATION === "1") {
      ctx.available = false;
      console.warn("[integration] SKIP_INTEGRATION=1 — on-chain tests skipped");
      return;
    }

    const up = await isValidatorReachable(ctx.connection);
    if (!up) {
      throw new Error(
        `[integration] No validator at ${LOCALNET_URL}.\n${VALIDATOR_START_HINT}`
      );
    }

    ctx.available = true;
    ctx.payer = payerKeypair();
    await ensureFunded(ctx.connection, ctx.payer);
  }, 90_000);

  return ctx;
}

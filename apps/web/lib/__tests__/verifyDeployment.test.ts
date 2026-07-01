import { checkMintCreation } from "../verifyDeployment";

const WALLET = "SessionWallet11111111111111111111111111111";
const OTHER = "OtherWallet111111111111111111111111111111";
const MINT = "MintAddress1111111111111111111111111111111";
const OTHER_MINT = "OtherMint11111111111111111111111111111111";
const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

interface FakeInstruction {
  programId: string;
  parsed?: { type: string; info?: Record<string, unknown> };
}

/** Minimal ParsedTransactionWithMeta stand-in for the fields checkMintCreation reads. */
function makeTx(opts: {
  keys: string[];
  err?: unknown;
  instructions?: FakeInstruction[];
}) {
  return {
    meta: { err: opts.err ?? null },
    transaction: {
      message: {
        accountKeys: opts.keys.map((k) => ({
          pubkey: { toBase58: () => k },
        })),
        instructions: (opts.instructions ?? []).map((ix) => ({
          programId: { toBase58: () => ix.programId },
          ...(ix.parsed ? { parsed: ix.parsed } : {}),
        })),
      },
    },
  } as any;
}

const initializeMintIx = (mint: string): FakeInstruction => ({
  programId: TOKEN_2022,
  parsed: { type: "initializeMint2", info: { mint, decimals: 9 } },
});

describe("checkMintCreation (Audit-1 TOB-03)", () => {
  it("accepts a valid Token-2022 deployment paid by the session wallet", () => {
    const tx = makeTx({
      keys: [WALLET, MINT, TOKEN_2022],
      instructions: [initializeMintIx(MINT)],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toEqual({ ok: true });
  });

  it("accepts initializeMint (v1) as well as initializeMint2", () => {
    const tx = makeTx({
      keys: [WALLET, MINT, TOKEN_2022],
      instructions: [
        { programId: TOKEN_2022, parsed: { type: "initializeMint", info: { mint: MINT } } },
      ],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toEqual({ ok: true });
  });

  it("rejects a null (unconfirmed/missing) transaction with 409", () => {
    expect(checkMintCreation(null, MINT, WALLET)).toMatchObject({ ok: false, status: 409 });
  });

  it("rejects a transaction that failed on-chain with 400", () => {
    const tx = makeTx({
      keys: [WALLET, MINT, TOKEN_2022],
      err: { InstructionError: [0, "Custom"] },
      instructions: [initializeMintIx(MINT)],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects when the session wallet is not the fee payer with 403", () => {
    const tx = makeTx({
      keys: [OTHER, MINT, TOKEN_2022],
      instructions: [initializeMintIx(MINT)],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 403 });
  });

  it("rejects when the mint is not referenced with 400", () => {
    const tx = makeTx({ keys: [WALLET, TOKEN_2022], instructions: [initializeMintIx(MINT)] });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a Token-2022 tx that merely REFERENCES the mint (e.g. a transfer)", () => {
    // Regression: fee-paying a transfer of an existing token must not allow
    // claiming that token as a deployment.
    const tx = makeTx({
      keys: [WALLET, MINT, TOKEN_2022],
      instructions: [
        { programId: TOKEN_2022, parsed: { type: "transferChecked", info: { mint: MINT } } },
      ],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects when initializeMint targets a DIFFERENT mint", () => {
    const tx = makeTx({
      keys: [WALLET, MINT, OTHER_MINT, TOKEN_2022],
      instructions: [initializeMintIx(OTHER_MINT)],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a non-Token-2022 transaction", () => {
    const tx = makeTx({ keys: [WALLET, MINT] });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });
});

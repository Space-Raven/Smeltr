import { checkMintCreation } from "../verifyDeployment";

const WALLET = "SessionWallet11111111111111111111111111111";
const OTHER = "OtherWallet111111111111111111111111111111";
const MINT = "MintAddress1111111111111111111111111111111";
const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

/** Minimal ParsedTransactionWithMeta stand-in for the fields checkMintCreation reads. */
function makeTx(opts: {
  keys: string[];
  err?: unknown;
  instructionProgramIds?: string[];
}) {
  return {
    meta: { err: opts.err ?? null },
    transaction: {
      message: {
        accountKeys: opts.keys.map((k) => ({
          pubkey: { toBase58: () => k },
        })),
        instructions: (opts.instructionProgramIds ?? []).map((p) => ({
          programId: { toBase58: () => p },
        })),
      },
    },
  } as any;
}

describe("checkMintCreation (Audit-1 TOB-03)", () => {
  it("accepts a valid Token-2022 deployment paid by the session wallet", () => {
    const tx = makeTx({ keys: [WALLET, MINT, TOKEN_2022] });
    expect(checkMintCreation(tx, MINT, WALLET)).toEqual({ ok: true });
  });

  it("accepts when Token-2022 appears only as an instruction programId", () => {
    const tx = makeTx({ keys: [WALLET, MINT], instructionProgramIds: [TOKEN_2022] });
    expect(checkMintCreation(tx, MINT, WALLET)).toEqual({ ok: true });
  });

  it("rejects a null (unconfirmed/missing) transaction with 409", () => {
    const r = checkMintCreation(null, MINT, WALLET);
    expect(r).toMatchObject({ ok: false, status: 409 });
  });

  it("rejects a transaction that failed on-chain with 400", () => {
    const tx = makeTx({ keys: [WALLET, MINT, TOKEN_2022], err: { InstructionError: [0, "Custom"] } });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects when the session wallet is not the fee payer with 403", () => {
    const tx = makeTx({ keys: [OTHER, MINT, TOKEN_2022] });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 403 });
  });

  it("rejects when the mint is not referenced with 400", () => {
    const tx = makeTx({ keys: [WALLET, TOKEN_2022] });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a non-Token-2022 transaction with 400", () => {
    const tx = makeTx({ keys: [WALLET, MINT] });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });
});

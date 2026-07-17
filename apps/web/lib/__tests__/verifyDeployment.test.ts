import {
  checkMintCreation,
  checkMetadataAttachment,
  METAPLEX_METADATA_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "../verifyDeployment";

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

const initializeMintIx = (mint: string, programId: string): FakeInstruction => ({
  programId,
  parsed: { type: "initializeMint2", info: { mint, decimals: 9 } },
});

describe("checkMintCreation (Audit-1 TOB-03)", () => {
  it("accepts a valid Token-2022 deployment paid by the session wallet", () => {
    const tx = makeTx({
      keys: [WALLET, MINT, TOKEN_2022],
      instructions: [initializeMintIx(MINT, TOKEN_2022)],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toEqual({ ok: true });
  });

  it("accepts a valid classic SPL deployment when mintProgramId is TOKEN_PROGRAM_ID", () => {
    const tx = makeTx({
      keys: [WALLET, MINT, TOKEN_PROGRAM_ID],
      instructions: [initializeMintIx(MINT, TOKEN_PROGRAM_ID)],
    });
    expect(
      checkMintCreation(tx, MINT, WALLET, { mintProgramId: TOKEN_PROGRAM_ID })
    ).toEqual({ ok: true });
  });

  it("rejects classic SPL tx when verifying as Token-2022", () => {
    const tx = makeTx({
      keys: [WALLET, MINT, TOKEN_PROGRAM_ID],
      instructions: [initializeMintIx(MINT, TOKEN_PROGRAM_ID)],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
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
      instructions: [initializeMintIx(MINT, TOKEN_2022)],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects when the session wallet is not the fee payer with 403", () => {
    const tx = makeTx({
      keys: [OTHER, MINT, TOKEN_2022],
      instructions: [initializeMintIx(MINT, TOKEN_2022)],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 403 });
  });

  it("rejects when the mint is not referenced with 400", () => {
    const tx = makeTx({ keys: [WALLET, TOKEN_2022], instructions: [initializeMintIx(MINT, TOKEN_2022)] });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a Token-2022 tx that merely REFERENCES the mint (e.g. a transfer)", () => {
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
      instructions: [initializeMintIx(OTHER_MINT, TOKEN_2022)],
    });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a non-Token-2022 transaction", () => {
    const tx = makeTx({ keys: [WALLET, MINT] });
    expect(checkMintCreation(tx, MINT, WALLET)).toMatchObject({ ok: false, status: 400 });
  });
});

// --- checkMetadataAttachment (Audit-2 High-2) --------------------------------

interface FakeDecodedInstruction {
  programId: string;
  parsed?: { type: string; info?: Record<string, unknown> };
  /** Partially-decoded shape: account pubkeys, no parsed body. */
  accounts?: string[];
}

function makeMetaTx(opts: {
  keys: string[];
  err?: unknown;
  instructions?: FakeDecodedInstruction[];
}) {
  return {
    meta: { err: opts.err ?? null },
    transaction: {
      message: {
        accountKeys: opts.keys.map((k) => ({ pubkey: { toBase58: () => k } })),
        instructions: (opts.instructions ?? []).map((ix) => ({
          programId: { toBase58: () => ix.programId },
          ...(ix.parsed ? { parsed: ix.parsed } : {}),
          ...(ix.accounts
            ? { accounts: ix.accounts.map((a) => ({ toBase58: () => a })) }
            : {}),
        })),
      },
    },
  } as any;
}

describe("checkMetadataAttachment (Audit-2 High-2)", () => {
  it("rejects a missing transaction with 409", () => {
    expect(checkMetadataAttachment(null, MINT, WALLET, "token-2022")).toMatchObject({
      ok: false,
      status: 409,
    });
  });

  it("rejects a failed transaction", () => {
    const tx = makeMetaTx({ keys: [WALLET, MINT], err: { InstructionError: [0, {}] } });
    expect(checkMetadataAttachment(tx, MINT, WALLET, "token-2022")).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("rejects when the session wallet is not the fee payer", () => {
    const tx = makeMetaTx({
      keys: [OTHER, MINT, TOKEN_2022],
      instructions: [{ programId: TOKEN_2022, accounts: [MINT] }],
    });
    expect(checkMetadataAttachment(tx, MINT, WALLET, "token-2022")).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("accepts a parsed Token-2022 initializeTokenMetadata targeting the mint", () => {
    const tx = makeMetaTx({
      keys: [WALLET, MINT, TOKEN_2022],
      instructions: [
        {
          programId: TOKEN_2022,
          parsed: { type: "initializeTokenMetadata", info: { metadata: MINT, mint: MINT } },
        },
      ],
    });
    expect(checkMetadataAttachment(tx, MINT, WALLET, "token-2022")).toEqual({ ok: true });
  });

  it("accepts a partially-decoded Token-2022 instruction whose accounts include the mint", () => {
    const tx = makeMetaTx({
      keys: [WALLET, MINT, TOKEN_2022],
      instructions: [{ programId: TOKEN_2022, accounts: [MINT, WALLET] }],
    });
    expect(checkMetadataAttachment(tx, MINT, WALLET, "token-2022")).toEqual({ ok: true });
  });

  it("rejects a parsed Token-2022 instruction of the wrong type (e.g. a transfer)", () => {
    const tx = makeMetaTx({
      keys: [WALLET, MINT, TOKEN_2022],
      instructions: [
        { programId: TOKEN_2022, parsed: { type: "transferChecked", info: { mint: MINT } } },
      ],
    });
    expect(checkMetadataAttachment(tx, MINT, WALLET, "token-2022")).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("rejects when the instruction targets a different mint", () => {
    const tx = makeMetaTx({
      keys: [WALLET, MINT, OTHER_MINT, TOKEN_2022],
      instructions: [{ programId: TOKEN_2022, accounts: [OTHER_MINT] }],
    });
    expect(checkMetadataAttachment(tx, MINT, WALLET, "token-2022")).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("requires the Metaplex program for legacy SPL — Token-2022 instruction is rejected", () => {
    const tx = makeMetaTx({
      keys: [WALLET, MINT, TOKEN_2022],
      instructions: [{ programId: TOKEN_2022, accounts: [MINT] }],
    });
    expect(checkMetadataAttachment(tx, MINT, WALLET, "spl-legacy")).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("accepts a Metaplex instruction referencing the mint for legacy SPL", () => {
    const tx = makeMetaTx({
      keys: [WALLET, MINT, METAPLEX_METADATA_PROGRAM_ID],
      instructions: [{ programId: METAPLEX_METADATA_PROGRAM_ID, accounts: [MINT, WALLET] }],
    });
    expect(checkMetadataAttachment(tx, MINT, WALLET, "spl-legacy")).toEqual({ ok: true });
  });

  it("rejects a transaction with no metadata-program instruction at all", () => {
    const tx = makeMetaTx({
      keys: [WALLET, MINT],
      instructions: [{ programId: "11111111111111111111111111111111", accounts: [MINT] }],
    });
    expect(checkMetadataAttachment(tx, MINT, WALLET, "token-2022")).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

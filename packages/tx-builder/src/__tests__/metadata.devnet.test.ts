import { Transaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getMetadataPointerState,
  getTokenMetadata,
} from "@solana/spl-token";
import { buildMintInstructions } from "../orchestrator";
import { buildMetadataAttachmentInstructions } from "../metadataAttachment";
import { Token2022NativeMetadataProvider, ModuleId } from "@platform/module-registry";
import { setupLocalnet, freshMintKeypair, sendAndConfirm } from "./fixtures";

/**
 * Requires a local validator: `solana-test-validator --reset`
 * Run with: jest --runInBand packages/tx-builder/src/__tests__/metadata.devnet.test.ts
 *
 * --runInBand matters here: this test submits real transactions against a
 * single local validator instance — parallel workers would race on blockhash.
 *
 * The payer keypair is persisted in __tests__/fixtures/.cache/payer.json so
 * it survives across runs without re-airdropping every time.
 */
describe("Token-2022 native metadata — two-transaction flow (local validator)", () => {
  const ctx = setupLocalnet();
  let mintKeypair = freshMintKeypair();

  const metadataInput = {
    name: "Audit Test Token",
    symbol: "AUDIT",
    uri: "https://example.com/audit-test-token.json",
  };

  it("creates a mint with Non-Transferable + MetadataPointer, then attaches TokenMetadata", async () => {
    // --- Transaction 1: CreateAccount, module init, MetadataPointer init, initializeMint ---
    const plan = await buildMintInstructions({
      connection: ctx.connection,
      payer: ctx.payer.publicKey,
      mint: mintKeypair.publicKey,
      userWallet: ctx.payer.publicKey,
      decimals: 0,
      mintAuthority: ctx.payer.publicKey,
      freezeAuthority: null,
      modules: [{ id: ModuleId.NON_TRANSFERABLE, params: {} }],
      metadata: {
        provider: Token2022NativeMetadataProvider,
        input: metadataInput,
      },
    });

    expect(plan.warnings).toEqual([]);

    const tx1 = new Transaction().add(...plan.instructions);
    await sendAndConfirm(ctx.connection, tx1, [ctx.payer, mintKeypair]);

    // --- Transaction 2: InitializeTokenMetadata only — no reallocate, ---
    // --- no lamport transfer; tx1 already overfunded the account.     ---
    const attachmentInstructions = buildMetadataAttachmentInstructions({
      mint: mintKeypair.publicKey,
      payer: ctx.payer.publicKey,
      userWallet: ctx.payer.publicKey,
      decimals: 0,
      provider: Token2022NativeMetadataProvider,
      input: metadataInput,
    });

    const tx2 = new Transaction().add(...attachmentInstructions);
    await sendAndConfirm(ctx.connection, tx2, [ctx.payer]);

    // --- Assertions: on-chain metadata matches input ----------------------
    const onChainMetadata = await getTokenMetadata(
      ctx.connection,
      mintKeypair.publicKey,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    expect(onChainMetadata?.name).toBe(metadataInput.name);
    expect(onChainMetadata?.symbol).toBe(metadataInput.symbol);
    expect(onChainMetadata?.uri).toBe(metadataInput.uri);
    expect(onChainMetadata?.updateAuthority?.toBase58()).toBe(ctx.payer.publicKey.toBase58());

    // --- Assertions: MetadataPointer self-references the mint -------------
    const mintAccount = await getMint(
      ctx.connection,
      mintKeypair.publicKey,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    const pointerState = getMetadataPointerState(mintAccount);
    expect(pointerState?.metadataAddress?.toBase58()).toBe(mintKeypair.publicKey.toBase58());

    // --- Assertions: rent-exemption survived the tx2 resize ---------------
    // This is the property tx1's overfunding (mintSpace + additionalMintSpace)
    // is specifically meant to guarantee.
    const rawAccount = await ctx.connection.getAccountInfo(mintKeypair.publicKey);
    expect(rawAccount).not.toBeNull();

    const minRentExempt = await ctx.connection.getMinimumBalanceForRentExemption(
      rawAccount!.data.length
    );
    expect(rawAccount!.lamports).toBeGreaterThanOrEqual(minRentExempt);
  });
});

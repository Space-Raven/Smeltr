import { Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import {
  Metadata,
  PROGRAM_ID as METAPLEX_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { MetaplexLegacyMetadataProvider, findMetaplexMetadataPda } from "@platform/module-registry";
import { legacySplAdapter } from "../chain/solana/legacySplAdapter";
import { buildMetadataAttachmentInstructions } from "../metadataAttachment";
import { setupLocalnet, freshMintKeypair, sendAndConfirm, LOCALNET_URL } from "./fixtures";

const METAPLEX_VALIDATOR_HINT =
  "Restart the local validator so it clones Metaplex Token Metadata:\n" +
  "  npm run validator:stop:wsl\n" +
  "  npm run validator:local:wsl";

/**
 * Classic SPL + Metaplex metadata — two-transaction flow (local validator).
 * Run with: npm run test:integration
 *
 * Requires solana-test-validator with --clone-upgradeable-program metaqbxx…
 * (npm run validator:local:wsl includes this).
 */
describe("Classic SPL + Metaplex metadata — two-transaction flow (local validator)", () => {
  const ctx = setupLocalnet();
  let mintKeypair = freshMintKeypair();

  const metadataInput = {
    name: "Legacy Metaplex Token",
    symbol: "LMPLX",
    uri: "https://example.com/legacy-metaplex-token.json",
  };

  beforeAll(async () => {
    if (!ctx.available) return;
    const program = await ctx.connection.getAccountInfo(METAPLEX_PROGRAM_ID);
    if (!program?.executable) {
      throw new Error(
        `[legacyMetaplex] Metaplex Token Metadata program is not loaded on ${LOCALNET_URL}.\n${METAPLEX_VALIDATOR_HINT}`
      );
    }
  });

  it("creates a classic SPL mint, then attaches Metaplex metadata", async () => {
    const plan = await legacySplAdapter.buildMintInstructions(
      { chainRecordId: "solana-devnet", connection: ctx.connection },
      {
        connection: ctx.connection,
        payer: ctx.payer.publicKey,
        mint: mintKeypair.publicKey,
        userWallet: ctx.payer.publicKey,
        decimals: 0,
        mintAuthority: ctx.payer.publicKey,
        freezeAuthority: null,
        modules: [],
        metadata: {
          provider: MetaplexLegacyMetadataProvider,
          input: metadataInput,
        },
      }
    );

    expect(plan.warnings).toEqual([]);

    const tx1 = new Transaction().add(...plan.instructions);
    await sendAndConfirm(ctx.connection, tx1, [ctx.payer, mintKeypair]);

    const mintInfo = await getMint(
      ctx.connection,
      mintKeypair.publicKey,
      "confirmed",
      TOKEN_PROGRAM_ID
    );
    expect(mintInfo.decimals).toBe(0);

    const attachmentInstructions = buildMetadataAttachmentInstructions({
      mint: mintKeypair.publicKey,
      payer: ctx.payer.publicKey,
      userWallet: ctx.payer.publicKey,
      decimals: 0,
      provider: MetaplexLegacyMetadataProvider,
      input: metadataInput,
      mintProgramId: TOKEN_PROGRAM_ID,
    });

    const tx2 = new Transaction().add(...attachmentInstructions);
    await sendAndConfirm(ctx.connection, tx2, [ctx.payer]);

    const metadataPda = findMetaplexMetadataPda(mintKeypair.publicKey);
    const onChain = await Metadata.fromAccountAddress(ctx.connection, metadataPda);

    expect(onChain.data.name.replace(/\0/g, "").trim()).toBe(metadataInput.name);
    expect(onChain.data.symbol.replace(/\0/g, "").trim()).toBe(metadataInput.symbol);
    expect(onChain.data.uri.replace(/\0/g, "").trim()).toBe(metadataInput.uri);
    expect(onChain.updateAuthority.toBase58()).toBe(ctx.payer.publicKey.toBase58());
  });
});

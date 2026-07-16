import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { MetaplexLegacyMetadataProvider } from "@platform/module-registry";
import { legacySplAdapter } from "../chain/solana/legacySplAdapter";

describe("legacySplAdapter", () => {
  const connection = {
    getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(1_461_600),
  } as unknown as import("@solana/web3.js").Connection;

  const payer = Keypair.generate().publicKey;
  const mint = Keypair.generate().publicKey;
  const userWallet = Keypair.generate().publicKey;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST =
      Keypair.generate().publicKey.toBase58();
  });

  it("builds createAccount + initializeMint for TOKEN_PROGRAM_ID", async () => {
    const result = await legacySplAdapter.buildMintInstructions(
      { chainRecordId: "solana-devnet", connection },
      {
        connection,
        payer,
        mint,
        userWallet,
        decimals: 9,
        mintAuthority: userWallet,
        freezeAuthority: null,
        modules: [],
      }
    );

    expect(result.instructions).toHaveLength(2);
    expect(result.instructions[1].programId.equals(TOKEN_PROGRAM_ID)).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("rejects Token-2022 modules on legacy path", async () => {
    await expect(
      legacySplAdapter.buildMintInstructions(
        { chainRecordId: "solana-devnet", connection },
        {
          connection,
          payer,
          mint,
          userWallet,
          decimals: 9,
          mintAuthority: userWallet,
          freezeAuthority: null,
          modules: [{ id: "transfer-fee" as never, params: {} }],
        }
      )
    ).rejects.toThrow(/Extension modules require Token-2022/);
  });

  it("buildMetadataAttachmentInstructions delegates to Metaplex provider", () => {
    const metadataInput = {
      name: "Test",
      symbol: "TST",
      uri: "https://example.com/t.json",
    };

    const instructions = legacySplAdapter.buildMetadataAttachmentInstructions(
      { chainRecordId: "solana-devnet", connection },
      {
        mint,
        payer,
        userWallet,
        decimals: 9,
        provider: MetaplexLegacyMetadataProvider,
        input: metadataInput,
      }
    );

    expect(instructions.length).toBeGreaterThanOrEqual(1);
  });
});

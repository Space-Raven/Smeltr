import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METAPLEX_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { ModuleContext, assertNoPlatformAuthority } from "../schema";
import { MetadataProvider, TokenMetadataInput } from "./types";

/** Metaplex metadata PDA for a classic SPL mint. */
export function findMetaplexMetadataPda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METAPLEX_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METAPLEX_TOKEN_METADATA_PROGRAM_ID
  )[0];
}

/**
 * Legacy Metaplex Token Metadata (separate PDA account).
 * Transaction 1 is a plain SPL mint; transaction 2 creates the metadata account.
 */
export const MetaplexLegacyMetadataProvider: MetadataProvider = {
  id: "metaplex-legacy",

  getPreInitExtensionTypes() {
    return [];
  },

  buildPreInitInstructions() {
    return [];
  },

  getAdditionalMintSpace() {
    return 0;
  },

  buildPostInitInstructions(ctx: ModuleContext, input: TokenMetadataInput) {
    assertNoPlatformAuthority(
      ctx.userWallet,
      "metadataUpdateAuthority",
      "metadata/metaplex-legacy"
    );

    const metadata = findMetaplexMetadataPda(ctx.mint);

    return [
      createCreateMetadataAccountV3Instruction(
        {
          metadata,
          mint: ctx.mint,
          mintAuthority: ctx.userWallet,
          payer: ctx.payer,
          updateAuthority: ctx.userWallet,
          systemProgram: SystemProgram.programId,
        },
        {
          createMetadataAccountArgsV3: {
            data: {
              name: input.name,
              symbol: input.symbol,
              uri: input.uri,
              sellerFeeBasisPoints: 0,
              creators: null,
              collection: null,
              uses: null,
            },
            isMutable: true,
            collectionDetails: null,
          },
        }
      ),
    ];
  },
};

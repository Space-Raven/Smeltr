import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  LENGTH_SIZE,
  createInitializeMetadataPointerInstruction,
} from "@solana/spl-token";
import { pack, createInitializeInstruction, TokenMetadata } from "@solana/spl-token-metadata";
import { ModuleContext, assertNoPlatformAuthority } from "../schema";
import { MetadataProvider, TokenMetadataInput } from "./types";

function toTokenMetadata(ctx: ModuleContext, input: TokenMetadataInput): TokenMetadata {
  return {
    mint: ctx.mint,
    name: input.name,
    symbol: input.symbol,
    uri: input.uri,
    additionalMetadata: [],
    updateAuthority: ctx.userWallet,
  };
}

/**
 * Token-2022 native metadata (MetadataPointer + TokenMetadata extensions).
 * See CLAUDE.md for the corrected two-transaction flow and why
 * createReallocateInstruction is NOT used.
 */
export const Token2022NativeMetadataProvider: MetadataProvider = {
  id: "token-2022-native",

  getPreInitExtensionTypes() {
    return [ExtensionType.MetadataPointer];
  },

  buildPreInitInstructions(ctx, _input) {
    // Self-referential: the mint stores its own metadata via the
    // TokenMetadata extension (transaction 2). The pointer simply
    // references the mint's own address as the metadata account.
    return [
      createInitializeMetadataPointerInstruction(
        ctx.mint,
        ctx.userWallet, // update authority for the pointer itself
        ctx.mint, // metadata address = the mint
        TOKEN_2022_PROGRAM_ID
      ),
    ];
  },

  getAdditionalMintSpace(ctx, input) {
    const metadata = toTokenMetadata(ctx, input);
    return TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
  },

  buildPostInitInstructions(ctx, input) {
    assertNoPlatformAuthority(
      ctx.userWallet,
      "metadataUpdateAuthority",
      "metadata/token-2022-native"
    );

    return [
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: ctx.mint,
        updateAuthority: ctx.userWallet,
        mint: ctx.mint,
        mintAuthority: ctx.userWallet,
        name: input.name,
        symbol: input.symbol,
        uri: input.uri,
      }),
    ];
  },
};

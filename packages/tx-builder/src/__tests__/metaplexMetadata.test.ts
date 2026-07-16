import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PROGRAM_ID as METAPLEX_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  MetaplexLegacyMetadataProvider,
  findMetaplexMetadataPda,
  assertNoPlatformAuthority,
} from "@platform/module-registry";

describe("MetaplexLegacyMetadataProvider", () => {
  const mint = Keypair.generate().publicKey;
  const payer = Keypair.generate().publicKey;
  const userWallet = Keypair.generate().publicKey;

  const input = {
    name: "Legacy Token",
    symbol: "LEG",
    uri: "https://example.com/legacy.json",
  };

  const ctx = {
    mint,
    payer,
    userWallet,
    decimals: 9,
    programId: TOKEN_PROGRAM_ID,
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST =
      Keypair.generate().publicKey.toBase58();
  });

  it("has id metaplex-legacy", () => {
    expect(MetaplexLegacyMetadataProvider.id).toBe("metaplex-legacy");
  });

  it("returns no pre-init extensions or additional mint space", () => {
    expect(MetaplexLegacyMetadataProvider.getPreInitExtensionTypes()).toEqual([]);
    expect(MetaplexLegacyMetadataProvider.buildPreInitInstructions(ctx, input)).toEqual([]);
    expect(MetaplexLegacyMetadataProvider.getAdditionalMintSpace(ctx, input)).toBe(0);
  });

  it("buildPostInitInstructions returns a Metaplex create-metadata ix", () => {
    const instructions = MetaplexLegacyMetadataProvider.buildPostInitInstructions(ctx, input);
    expect(instructions.length).toBeGreaterThanOrEqual(1);
    expect(instructions[0].programId.equals(METAPLEX_PROGRAM_ID)).toBe(true);

    const metadataPda = findMetaplexMetadataPda(mint);
    expect(instructions[0].keys.some((k) => k.pubkey.equals(metadataPda))).toBe(true);
  });

  it("rejects a platform key as metadata update authority", () => {
    const platformKey = Keypair.generate().publicKey;
    process.env.NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST = platformKey.toBase58();

    expect(() =>
      assertNoPlatformAuthority(
        platformKey,
        "metadataUpdateAuthority",
        "metadata/metaplex-legacy"
      )
    ).toThrow(/SECURITY/);

    const blockedCtx = { ...ctx, userWallet: platformKey };
    expect(() =>
      MetaplexLegacyMetadataProvider.buildPostInitInstructions(blockedCtx, input)
    ).toThrow(/SECURITY/);
  });
});

describe("findMetaplexMetadataPda", () => {
  it("derives a deterministic PDA for a mint", () => {
    const mint = Keypair.generate().publicKey;
    const a = findMetaplexMetadataPda(mint);
    const b = findMetaplexMetadataPda(mint);
    expect(a.equals(b)).toBe(true);
    expect(a).toBeInstanceOf(PublicKey);
  });
});

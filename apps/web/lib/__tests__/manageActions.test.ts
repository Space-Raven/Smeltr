import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, AuthorityType } from "@solana/spl-token";
import {
  MAX_HARVEST_SOURCES_PER_TX,
  buildHarvestWithheldToMint,
  buildRevokeFreezeAuthority,
  buildRevokeMintAuthority,
  buildWithdrawWithheldFromMint,
} from "../manageActions";

const MINT = new PublicKey("So11111111111111111111111111111111111111112");
// On-curve, like a real wallet key — ATAs can't be derived for off-curve owners.
const AUTHORITY = Keypair.generate().publicKey;

describe("manage-action builders (Phase D)", () => {
  it("revoke mint authority targets the right program per standard", () => {
    const [ix2022] = buildRevokeMintAuthority({
      mint: MINT,
      currentAuthority: AUTHORITY,
      standard: "token-2022",
    });
    expect(ix2022.programId.equals(TOKEN_2022_PROGRAM_ID)).toBe(true);

    const [ixLegacy] = buildRevokeMintAuthority({
      mint: MINT,
      currentAuthority: AUTHORITY,
      standard: "spl-legacy",
    });
    expect(ixLegacy.programId.equals(TOKEN_PROGRAM_ID)).toBe(true);
  });

  it("revoke instructions set the new authority to NONE (byte layout)", () => {
    const [ix] = buildRevokeMintAuthority({
      mint: MINT,
      currentAuthority: AUTHORITY,
      standard: "token-2022",
    });
    // SetAuthority data: [instruction=6, authorityType, newAuthorityOption, ...]
    expect(ix.data[0]).toBe(6);
    expect(ix.data[1]).toBe(AuthorityType.MintTokens);
    expect(ix.data[2]).toBe(0); // COption::None — authority revoked, not reassigned

    const [fix] = buildRevokeFreezeAuthority({
      mint: MINT,
      currentAuthority: AUTHORITY,
      standard: "token-2022",
    });
    expect(fix.data[1]).toBe(AuthorityType.FreezeAccount);
    expect(fix.data[2]).toBe(0);
  });

  it("revoke instructions require the current authority as signer, mint writable", () => {
    const [ix] = buildRevokeMintAuthority({
      mint: MINT,
      currentAuthority: AUTHORITY,
      standard: "token-2022",
    });
    const mintMeta = ix.keys.find((k) => k.pubkey.equals(MINT));
    const authMeta = ix.keys.find((k) => k.pubkey.equals(AUTHORITY));
    expect(mintMeta?.isWritable).toBe(true);
    expect(authMeta?.isSigner).toBe(true);
  });

  it("harvest builder: empty sources → no instructions; over cap → throws", () => {
    expect(buildHarvestWithheldToMint({ mint: MINT, sources: [] })).toEqual([]);
    const tooMany = Array.from(
      { length: MAX_HARVEST_SOURCES_PER_TX + 1 },
      () => AUTHORITY
    );
    expect(() => buildHarvestWithheldToMint({ mint: MINT, sources: tooMany })).toThrow(
      /At most/
    );
  });

  it("harvest builder lists the mint writable and each source", () => {
    const [ix] = buildHarvestWithheldToMint({ mint: MINT, sources: [AUTHORITY] });
    expect(ix.programId.equals(TOKEN_2022_PROGRAM_ID)).toBe(true);
    expect(ix.keys[0].pubkey.equals(MINT)).toBe(true);
    expect(ix.keys[0].isWritable).toBe(true);
    expect(ix.keys.some((k) => k.pubkey.equals(AUTHORITY))).toBe(true);
  });

  it("withdraw-from-mint sends fees to the authority's own ATA, created idempotently", () => {
    const { instructions, destination } = buildWithdrawWithheldFromMint({
      mint: MINT,
      withdrawAuthority: AUTHORITY,
    });
    expect(instructions).toHaveLength(2);
    // 1st: idempotent ATA create, funded and owned by the authority itself.
    const [createAta, withdraw] = instructions;
    expect(createAta.keys[0].pubkey.equals(AUTHORITY)).toBe(true); // payer
    expect(createAta.keys[1].pubkey.equals(destination)).toBe(true);
    // 2nd: withdraw targets mint + destination, signed by the authority —
    // never a platform key (non-custodial invariant).
    expect(withdraw.programId.equals(TOKEN_2022_PROGRAM_ID)).toBe(true);
    expect(withdraw.keys.some((k) => k.pubkey.equals(destination))).toBe(true);
    const signer = withdraw.keys.find((k) => k.isSigner);
    expect(signer?.pubkey.equals(AUTHORITY)).toBe(true);
  });
});

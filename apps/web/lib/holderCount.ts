import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, unpackAccount } from "@solana/spl-token";

/**
 * Count holders (token accounts with a non-zero balance) for a mint.
 * Server-side only — one getProgramAccounts scan per mint on the platform
 * RPC (mint pubkey sits at offset 0 of every token account for both
 * programs). Used by the milestone cron; throws on RPCs that refuse the
 * scan so the caller can skip rather than record a bogus zero.
 */
export async function countHolders(
  connection: Connection,
  mintAddress: string,
  tokenStandard: "token-2022" | "spl-legacy"
): Promise<number> {
  const programId = tokenStandard === "spl-legacy" ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;
  const mintPubkey = new PublicKey(mintAddress);
  const accounts = await connection.getProgramAccounts(programId, {
    commitment: "confirmed",
    filters: [{ memcmp: { offset: 0, bytes: mintPubkey.toBase58() } }],
  });

  let holders = 0;
  for (const { pubkey, account } of accounts) {
    try {
      const parsed = unpackAccount(pubkey, account, programId);
      if (parsed.amount > 0n) holders++;
    } catch {
      // Not a parseable token account — skip.
    }
  }
  return holders;
}

import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

/**
 * Base58-encoded Solana public key string (as received from form input /
 * API payloads), validated and transformed into a PublicKey instance.
 */
export const PublicKeyStringSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      try {
        new PublicKey(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Must be a valid base58-encoded Solana public key" }
  )
  .transform((val) => new PublicKey(val));

/**
 * Authority fields use this schema rather than PublicKeyStringSchema
 * directly so they're greppable — every usage is a candidate for the
 * denylist check inside buildInitInstructions. There is intentionally NO
 * default/optional variant of this schema; authorities must always be
 * explicitly supplied by the caller (i.e., the user's wallet).
 */
export const AuthorityPublicKeySchema = PublicKeyStringSchema;

/**
 * u64 values (fees, amounts) arrive as numeric strings to avoid JS Number
 * precision loss above 2^53, and are coerced to bigint.
 */
export const U64StringSchema = z
  .string()
  .regex(/^\d+$/, "Must be a non-negative integer string")
  .transform((val) => BigInt(val))
  .refine((val) => val <= 18446744073709551615n, {
    message: "Value exceeds u64 maximum",
  });

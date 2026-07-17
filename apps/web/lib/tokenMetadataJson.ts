import { z } from "zod";

/**
 * Schema for token metadata JSON on the PLATFORM-FUNDED upload path
 * (Audit-2 Low-1). The platform pays to publish this permanently to Arweave,
 * so it must actually be token metadata — not arbitrary JSON hosted on our
 * dime. Field set mirrors what MetadataForm produces plus the common optional
 * extras; unknown top-level keys are rejected.
 */

/** Tighter cap for JSON than the general image cap — metadata JSON is tiny. */
export const MAX_METADATA_JSON_BYTES = 16 * 1024;

const HttpsUrl = z
  .string()
  .max(2048)
  .url()
  .refine((u) => u.startsWith("https://"), "Must be an https URL");

const TokenMetadataJsonSchema = z
  .object({
    name: z.string().min(1).max(64),
    symbol: z.string().min(1).max(16),
    description: z.string().max(2000).optional(),
    image: HttpsUrl.optional(),
    external_url: HttpsUrl.optional(),
    attributes: z
      .array(
        z
          .object({
            trait_type: z.string().max(128).optional(),
            value: z.union([z.string().max(256), z.number()]).optional(),
          })
          .strict()
      )
      .max(50)
      .optional(),
  })
  .strict();

export type TokenMetadataJsonVerdict = { ok: true } | { ok: false; reason: string };

export function validateTokenMetadataJson(raw: string): TokenMetadataJsonVerdict {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "Not valid JSON." };
  }
  const result = TokenMetadataJsonSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join(".") || "(root)";
    return { ok: false, reason: `Not token metadata JSON: ${path} — ${first?.message ?? "invalid"}.` };
  }
  return { ok: true };
}

/** Client-side Smeltr+ kill switch (inlined at build time). */
export function isSmeltrPlusLiveClient(): boolean {
  return process.env.NEXT_PUBLIC_SMELTR_PLUS_ENABLED === "true";
}

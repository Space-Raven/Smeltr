import { validateTokenMetadataJson } from "../tokenMetadataJson";

describe("validateTokenMetadataJson (Audit-2 Low-1)", () => {
  it("accepts the exact shape MetadataForm produces", () => {
    const json = JSON.stringify({
      name: "Forge Coin",
      symbol: "FORGE",
      description: "A community coin.",
      image: "https://gateway.irys.xyz/abc123",
    });
    expect(validateTokenMetadataJson(json)).toEqual({ ok: true });
  });

  it("accepts minimal metadata (name + symbol only)", () => {
    expect(validateTokenMetadataJson(JSON.stringify({ name: "X", symbol: "X" }))).toEqual({
      ok: true,
    });
  });

  it("rejects invalid JSON", () => {
    expect(validateTokenMetadataJson("{not json")).toMatchObject({ ok: false });
  });

  it("rejects non-object JSON", () => {
    expect(validateTokenMetadataJson('"a string"')).toMatchObject({ ok: false });
    expect(validateTokenMetadataJson("[1,2,3]")).toMatchObject({ ok: false });
  });

  it("rejects unknown top-level keys (arbitrary JSON hosting)", () => {
    const json = JSON.stringify({ name: "X", symbol: "X", payload: "x".repeat(100) });
    expect(validateTokenMetadataJson(json)).toMatchObject({ ok: false });
  });

  it("rejects missing name/symbol", () => {
    expect(validateTokenMetadataJson(JSON.stringify({ name: "X" }))).toMatchObject({ ok: false });
    expect(validateTokenMetadataJson(JSON.stringify({ symbol: "X" }))).toMatchObject({ ok: false });
  });

  it("rejects oversized fields", () => {
    expect(
      validateTokenMetadataJson(JSON.stringify({ name: "n".repeat(65), symbol: "X" }))
    ).toMatchObject({ ok: false });
    expect(
      validateTokenMetadataJson(
        JSON.stringify({ name: "X", symbol: "X", description: "d".repeat(2001) })
      )
    ).toMatchObject({ ok: false });
  });

  it("rejects non-https image URLs", () => {
    expect(
      validateTokenMetadataJson(
        JSON.stringify({ name: "X", symbol: "X", image: "http://example.com/x.png" })
      )
    ).toMatchObject({ ok: false });
    expect(
      validateTokenMetadataJson(
        JSON.stringify({ name: "X", symbol: "X", image: "javascript:alert(1)" })
      )
    ).toMatchObject({ ok: false });
  });

  it("accepts bounded attributes and rejects malformed ones", () => {
    expect(
      validateTokenMetadataJson(
        JSON.stringify({
          name: "X",
          symbol: "X",
          attributes: [{ trait_type: "tier", value: "founding" }],
        })
      )
    ).toEqual({ ok: true });
    expect(
      validateTokenMetadataJson(
        JSON.stringify({ name: "X", symbol: "X", attributes: [{ evil: {} }] })
      )
    ).toMatchObject({ ok: false });
  });
});

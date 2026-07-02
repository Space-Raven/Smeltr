import {
  listModules,
  describeModule,
  validateConfig,
  estimateCost,
  PLATFORM_FEE_SOL,
} from "../tools";

describe("listModules", () => {
  it("returns the three supported modules with metadata", () => {
    const mods = listModules();
    const ids = mods.map((m) => m.id).sort();
    expect(ids).toEqual(["non-transferable", "permanent-delegate", "transfer-fee"]);
    expect(mods.find((m) => m.id === "permanent-delegate")?.highImpact).toBe(true);
    expect(mods.every((m) => typeof m.description === "string" && m.description.length > 0)).toBe(true);
  });
});

describe("describeModule", () => {
  it("returns parameter specs for transfer-fee incl. authority flags", () => {
    const d = describeModule("transfer-fee") as { parameters: Array<{ name: string; authority: boolean }> };
    const names = d.parameters.map((p) => p.name);
    expect(names).toContain("transferFeeBasisPoints");
    expect(names).toContain("withdrawWithheldAuthority");
    expect(d.parameters.find((p) => p.name === "withdrawWithheldAuthority")?.authority).toBe(true);
  });

  it("non-transferable has no parameters", () => {
    const d = describeModule("non-transferable") as { parameters: unknown[] };
    expect(d.parameters).toEqual([]);
  });

  it("errors clearly on an unknown module", () => {
    expect(describeModule("nope")).toMatchObject({ error: expect.stringContaining("Unknown module") });
  });
});

describe("validateConfig (real engine)", () => {
  const VALID_PUBKEY = "So11111111111111111111111111111111111111112";

  it("accepts a well-formed transfer-fee config", () => {
    const r = validateConfig({
      modules: [
        {
          id: "transfer-fee",
          params: {
            transferFeeBasisPoints: 100,
            maximumFee: "1000000",
            transferFeeConfigAuthority: VALID_PUBKEY,
            withdrawWithheldAuthority: VALID_PUBKEY,
          },
        },
      ],
    });
    expect(r.valid).toBe(true);
    expect(r.compatibilityErrors).toHaveLength(0);
  });

  it("flags an unknown module as a compatibility error", () => {
    const r = validateConfig({ modules: [{ id: "made-up" }] });
    expect(r.valid).toBe(false);
    expect(r.compatibilityErrors.length).toBeGreaterThan(0);
  });

  it("reports parameter issues for out-of-range basis points", () => {
    const r = validateConfig({
      modules: [
        {
          id: "transfer-fee",
          params: {
            transferFeeBasisPoints: 99999,
            maximumFee: "0",
            transferFeeConfigAuthority: VALID_PUBKEY,
            withdrawWithheldAuthority: VALID_PUBKEY,
          },
        },
      ],
    });
    expect(r.valid).toBe(false);
    expect(r.parameterIssues[0].moduleId).toBe("transfer-fee");
  });

  it("surfaces a soft-conflict warning for transfer-fee + non-transferable", () => {
    const r = validateConfig({
      modules: [
        {
          id: "transfer-fee",
          params: {
            transferFeeBasisPoints: 100,
            maximumFee: "0",
            transferFeeConfigAuthority: VALID_PUBKEY,
            withdrawWithheldAuthority: VALID_PUBKEY,
          },
        },
        { id: "non-transferable", params: {} },
      ],
    });
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe("estimateCost", () => {
  it("returns the exact platform fee and a rent range", () => {
    const c = estimateCost({ modules: [{ id: "transfer-fee" }] });
    expect(c.platformFeeSol).toBe(PLATFORM_FEE_SOL);
    expect(c.estimatedRentSolRange[0]).toBeLessThanOrEqual(c.estimatedRentSolRange[1]);
    expect(c.note).toMatch(/estimate/i);
  });
});

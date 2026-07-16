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

  // A3-U1: Token-2022 transfer-fee unchanged
  it("accepts a well-formed transfer-fee config", () => {
    const r = validateConfig({
      tokenStandard: "token-2022",
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

  // A3-U6: omitted tokenStandard defaults to token-2022
  it("defaults to token-2022 when tokenStandard is omitted", () => {
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
    expect(r.tokenStandard).toBe("token-2022");
  });

  // A3-U2: legacy + empty modules
  it("accepts spl-legacy with no modules", () => {
    const r = validateConfig({ tokenStandard: "spl-legacy", modules: [] });
    expect(r.valid).toBe(true);
    expect(r.tokenStandard).toBe("spl-legacy");
    expect(r.note).toMatch(/Classic SPL/i);
  });

  // A3-U3: legacy + transfer-fee module rejected
  it("rejects spl-legacy with extension modules", () => {
    const r = validateConfig({
      tokenStandard: "spl-legacy",
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
      ],
    });
    expect(r.valid).toBe(false);
    expect(r.compatibilityErrors.join(" ")).toMatch(/Token-2022|modules/i);
  });

  // A3-U4: legacy + permanent-delegate rejected
  it("rejects spl-legacy with permanent-delegate", () => {
    const r = validateConfig({
      tokenStandard: "spl-legacy",
      modules: [{ id: "permanent-delegate", params: { delegate: VALID_PUBKEY } }],
    });
    expect(r.valid).toBe(false);
    expect(r.compatibilityErrors.length).toBeGreaterThan(0);
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
  it("returns the exact platform fee and a rent range for Token-2022", () => {
    const c = estimateCost({ modules: [{ id: "transfer-fee" }] });
    expect(c.platformFeeSol).toBe(PLATFORM_FEE_SOL);
    expect(c.estimatedRentSolRange[0]).toBeLessThanOrEqual(c.estimatedRentSolRange[1]);
    expect(c.note).toMatch(/estimate/i);
  });

  // A3-U5: legacy has lower rent ceiling and mentions Classic SPL
  it("returns lower rent for spl-legacy than multi-module Token-2022", () => {
    const legacy = estimateCost({ tokenStandard: "spl-legacy", modules: [] });
    const t22 = estimateCost({
      tokenStandard: "token-2022",
      modules: [{ id: "transfer-fee" }],
    });

    expect(legacy.platformFeeSol).toBe(PLATFORM_FEE_SOL);
    expect(legacy.tokenStandard).toBe("spl-legacy");
    expect(legacy.estimatedRentSolRange[1]).toBeLessThan(t22.estimatedRentSolRange[1]);
    expect(legacy.note).toMatch(/Classic SPL/i);
  });
});

import {
  isExternallyAudited,
  assertModuleVerificationIntegrity,
  compareInitOrder,
  MODULE_REGISTRY,
} from "@platform/module-registry";

describe("isExternallyAudited (Audit-1 TOB-12)", () => {
  it("is false when verified but the reference is a TODO placeholder", () => {
    expect(
      isExternallyAudited({ verified: true, auditReference: "TODO: link audit report" })
    ).toBe(false);
  });

  it("is false when verified but no reference", () => {
    expect(isExternallyAudited({ verified: true, auditReference: undefined })).toBe(false);
    expect(isExternallyAudited({ verified: true, auditReference: "   " })).toBe(false);
  });

  it("is false when not verified", () => {
    expect(isExternallyAudited({ verified: false, auditReference: "https://audit/report" })).toBe(false);
  });

  it("is true only with verified + a real reference", () => {
    expect(
      isExternallyAudited({ verified: true, auditReference: "https://reports.example/smeltr-2026" })
    ).toBe(true);
  });
});

describe("assertModuleVerificationIntegrity", () => {
  const base = {
    id: "transfer-fee" as any,
    name: "x",
    description: "x",
    extensionTypes: [],
    paramsSchema: {} as any,
    incompatibleWith: [],
    buildInitInstructions: () => [],
  };

  it("throws on verified:true with a placeholder reference", () => {
    expect(() =>
      assertModuleVerificationIntegrity({
        ...base,
        verified: true,
        auditReference: "TODO: later",
      })
    ).toThrow(/verified:true but cites no completed audit/i);
  });

  it("does not throw when verified:false", () => {
    expect(() =>
      assertModuleVerificationIntegrity({ ...base, verified: false })
    ).not.toThrow();
  });

  it("does not throw with verified:true + a real reference", () => {
    expect(() =>
      assertModuleVerificationIntegrity({
        ...base,
        verified: true,
        auditReference: "https://reports.example/audit",
      })
    ).not.toThrow();
  });
});

describe("shipped module registry", () => {
  it("passes the verification integrity invariant", () => {
    for (const mod of Object.values(MODULE_REGISTRY)) {
      expect(() => assertModuleVerificationIntegrity(mod)).not.toThrow();
    }
  });

  it("does not falsely advertise any module as externally audited", () => {
    // No external audit exists yet — nothing should read as audited.
    for (const mod of Object.values(MODULE_REGISTRY)) {
      expect(isExternallyAudited(mod)).toBe(false);
    }
  });
});

describe("compareInitOrder (Audit-1 TOB-15)", () => {
  it("treats missing priority as 0", () => {
    expect(compareInitOrder({}, { initOrderPriority: 0 })).toBe(0);
    expect(compareInitOrder({ initOrderPriority: -1 }, {})).toBeLessThan(0);
    expect(compareInitOrder({ initOrderPriority: 5 }, {})).toBeGreaterThan(0);
  });

  it("sorts ascending and is stable for equal priorities", () => {
    const items = [
      { tag: "a" },
      { tag: "b", initOrderPriority: -10 },
      { tag: "c" },
      { tag: "d", initOrderPriority: 10 },
    ];
    const sorted = [...items].sort(compareInitOrder).map((i) => i.tag);
    // b (−10) first; a and c (both 0) keep input order; d (10) last.
    expect(sorted).toEqual(["b", "a", "c", "d"]);
  });
});

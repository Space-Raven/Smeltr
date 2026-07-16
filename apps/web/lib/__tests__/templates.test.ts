import { ModuleId, validateModuleSelection } from "@platform/module-registry";
import {
  TOKEN_TEMPLATES,
  getTemplate,
  templateToModuleSelections,
} from "../templates";

describe("token templates (Phase A outcome-first funnel)", () => {
  it("exposes the five outcome templates with stable ids", () => {
    expect(TOKEN_TEMPLATES.map((t) => t.id)).toEqual([
      "community-coin",
      "creator-coin",
      "reward-points",
      "membership-pass",
      "collectible",
    ]);
  });

  it("every template has normie-facing copy and no undefined decimals", () => {
    for (const t of TOKEN_TEMPLATES) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(20);
      expect(t.fairLaunch.length).toBeGreaterThan(0);
      expect(Number.isInteger(t.decimals)).toBe(true);
    }
  });

  it("getTemplate resolves by id and returns undefined for unknown", () => {
    expect(getTemplate("membership-pass")?.label).toBe("Membership Pass");
    expect(getTemplate("nope")).toBeUndefined();
  });

  it("no Phase A template uses high-impact modules (fee/permanent-delegate)", () => {
    for (const t of TOKEN_TEMPLATES) {
      expect(t.moduleIds).not.toContain(ModuleId.TRANSFER_FEE);
      expect(t.moduleIds).not.toContain(ModuleId.PERMANENT_DELEGATE);
    }
  });

  it("templateToModuleSelections produces registry-valid selections", () => {
    for (const t of TOKEN_TEMPLATES) {
      const sel = templateToModuleSelections(t);
      expect(sel.map((s) => s.id)).toEqual(t.moduleIds);
      // The selection must pass the registry's own compatibility check.
      const result = validateModuleSelection(sel.map((s) => s.id));
      expect(result.valid).toBe(true);
    }
  });

  it("passes/collectibles are non-transferable and use 0 decimals", () => {
    for (const id of ["membership-pass", "collectible"]) {
      const t = getTemplate(id)!;
      expect(t.moduleIds).toContain(ModuleId.NON_TRANSFERABLE);
      expect(t.decimals).toBe(0);
    }
  });
});

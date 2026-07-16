import { ModuleId } from "@platform/module-registry";
import type { ModuleSelection } from "@platform/tx-builder";

/**
 * Outcome-first token templates (strategy overhaul Phase A).
 *
 * The overhaul thesis: lead with WHAT the user wants to make, in plain language,
 * with fair-launch defaults — not "deploy Token-2022 with extensions." Each
 * template maps a human outcome to a concrete, valid module configuration and
 * sane defaults, so the /create funnel can be name → symbol → image → done.
 *
 * Deliberately conservative for Phase A: templates use only the zero-config,
 * non-custodial-safe surface (plain fungible token, or Non-Transferable which
 * has empty params). Transfer Fee and Permanent Delegate require authority
 * inputs and are high-impact — they stay in the /deploy "Advanced" console, not
 * in the normie funnel.
 *
 * Pure data + a pure builder so it is unit-testable and reusable (SEO /modules,
 * homepage CTAs, MCP examples).
 */

export interface TokenTemplate {
  /** URL/id slug, e.g. "community-coin". */
  id: string;
  label: string;
  emoji: string;
  /** One-line plain-language hook. */
  tagline: string;
  /** What it makes + who it's for, in normie language. No jargon. */
  description: string;
  /** Fair-launch / trust reassurances shown to the user. */
  fairLaunch: string[];
  /** Sensible default decimals for this outcome. */
  decimals: number;
  /** Modules this template enables (empty = plain fungible token). */
  moduleIds: ModuleId[];
  /** Concrete, valid params per enabled module. */
  moduleParams: Partial<Record<ModuleId, unknown>>;
  /** Placeholder copy for the name field, to anchor the user. */
  namePlaceholder: string;
  symbolPlaceholder: string;
}

const FAIR_LAUNCH_BASE = [
  "You hold the keys — Smeltr never controls your token or funds.",
  "No freeze authority: no one can freeze holders' balances.",
  "No hidden delegate: no one can move tokens out of holders' wallets.",
];

export const TOKEN_TEMPLATES: readonly TokenTemplate[] = [
  {
    id: "community-coin",
    label: "Community Coin",
    emoji: "🪙",
    tagline: "A coin for your community",
    description:
      "A simple coin your community, server, or group can hold and send to each other. Great for Discords, clubs, and online communities.",
    fairLaunch: FAIR_LAUNCH_BASE,
    decimals: 9,
    moduleIds: [],
    moduleParams: {},
    namePlaceholder: "Forge Community Coin",
    symbolPlaceholder: "FORGE",
  },
  {
    id: "creator-coin",
    label: "Creator Coin",
    emoji: "🎨",
    tagline: "Your personal creator coin",
    description:
      "Your own coin that fans and supporters can hold — a piece of your world. Give it out for support, use it for access, or just for fun.",
    fairLaunch: FAIR_LAUNCH_BASE,
    decimals: 9,
    moduleIds: [],
    moduleParams: {},
    namePlaceholder: "My Creator Coin",
    symbolPlaceholder: "MINE",
  },
  {
    id: "reward-points",
    label: "Reward Points",
    emoji: "⭐",
    tagline: "Loyalty points you hand out",
    description:
      "Points you give to customers, members, or players. Whole numbers, no fractions — like a punch card, but on-chain and yours to control.",
    fairLaunch: FAIR_LAUNCH_BASE,
    decimals: 0,
    moduleIds: [],
    moduleParams: {},
    namePlaceholder: "Loyalty Points",
    symbolPlaceholder: "PTS",
  },
  {
    id: "membership-pass",
    label: "Membership Pass",
    emoji: "🎟️",
    tagline: "A pass that proves membership",
    description:
      "A non-transferable pass that proves someone is a member. It can't be resold or moved to another wallet — it stays with the person you gave it to.",
    fairLaunch: [
      "Non-transferable: the pass can't be resold or moved between wallets.",
      ...FAIR_LAUNCH_BASE.slice(0, 2),
    ],
    decimals: 0,
    moduleIds: [ModuleId.NON_TRANSFERABLE],
    moduleParams: { [ModuleId.NON_TRANSFERABLE]: {} },
    namePlaceholder: "Founding Member Pass",
    symbolPlaceholder: "PASS",
  },
  {
    id: "collectible",
    label: "Collectible",
    emoji: "🏅",
    tagline: "A digital collectible or badge",
    description:
      "A soul-bound collectible or achievement badge. Once someone earns it, it's theirs to keep — it can't be transferred away.",
    fairLaunch: [
      "Soul-bound: the collectible stays with whoever earns it.",
      ...FAIR_LAUNCH_BASE.slice(0, 2),
    ],
    decimals: 0,
    moduleIds: [ModuleId.NON_TRANSFERABLE],
    moduleParams: { [ModuleId.NON_TRANSFERABLE]: {} },
    namePlaceholder: "Genesis Badge",
    symbolPlaceholder: "BADGE",
  },
];

export function getTemplate(id: string): TokenTemplate | undefined {
  return TOKEN_TEMPLATES.find((t) => t.id === id);
}

/** Build the ModuleSelection[] the deploy flow expects from a template. */
export function templateToModuleSelections(t: TokenTemplate): ModuleSelection[] {
  return t.moduleIds.map((id) => ({ id, params: t.moduleParams[id] ?? {} }));
}

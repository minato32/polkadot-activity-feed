import type { EventType, Significance } from "./types.js";

/** Transfer thresholds in planck (DOT has 10 decimals) */
export const TRANSFER_THRESHOLDS = {
  /** 1K DOT = 1_000 * 10^10 planck */
  notable: 10_000_000_000_000n,
  /** 100K DOT = 100_000 * 10^10 planck */
  major: 1_000_000_000_000_000n,
} as const;

/** Treasury award thresholds in planck */
export const TREASURY_THRESHOLDS = {
  /** 10K DOT */
  notable: 100_000_000_000_000n,
  /** 100K DOT */
  major: 1_000_000_000_000_000n,
} as const;

/** Swap thresholds in planck */
export const SWAP_THRESHOLDS = {
  /** 10K DOT equivalent */
  notable: 100_000_000_000_000n,
} as const;

/** Events that are always Major (significance 2) */
const ALWAYS_MAJOR: EventType[] = [
  "staking_slash",
  "runtime_upgrade",
  "xcm_failed",
  "governance_confirmed",
  "governance_rejected",
];

/** Events that are always Notable (significance 1) */
const ALWAYS_NOTABLE: EventType[] = [
  "governance_submitted",
  "validator_offline",
  "coretime_purchased",
];

/**
 * Compute significance score for an event.
 * Pure function — no side effects, no DB calls.
 */
export function computeSignificance(
  eventType: EventType,
  data: Record<string, unknown>,
): Significance {
  // Always Major
  if (ALWAYS_MAJOR.includes(eventType)) {
    return 2;
  }

  // Always Notable
  if (ALWAYS_NOTABLE.includes(eventType)) {
    return 1;
  }

  // Transfer: score by amount
  if (eventType === "transfer") {
    return scoreByAmount(data, TRANSFER_THRESHOLDS);
  }

  // Treasury awards: score by amount
  if (eventType === "treasury_awarded") {
    const amountScore = scoreByAmount(data, TREASURY_THRESHOLDS);
    // Treasury awards are at least Notable
    return Math.max(1, amountScore) as Significance;
  }

  // Swaps: score by amount
  if (eventType === "swap_executed") {
    return scoreByAmount(data, SWAP_THRESHOLDS);
  }

  // Everything else: Normal
  return 0;
}

/** Score based on amount field in event data */
function scoreByAmount(
  data: Record<string, unknown>,
  thresholds: { notable: bigint; major: bigint } | { notable: bigint },
): Significance {
  const amount = extractAmount(data);
  if (amount === null) return 0;

  if ("major" in thresholds && amount >= thresholds.major) return 2;
  if (amount >= thresholds.notable) return 1;
  return 0;
}

/** Extract numeric amount from event data */
function extractAmount(data: Record<string, unknown>): bigint | null {
  const raw = data["amount"] ?? data["value"] ?? data["balance"];
  if (raw === undefined || raw === null) return null;

  try {
    return BigInt(raw as string | number | bigint);
  } catch {
    return null;
  }
}

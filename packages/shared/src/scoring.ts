import type { EventType, Significance } from "./types.js";
import {
  computeSignificance,
  TREASURY_THRESHOLDS,
} from "./significance.js";

/** Additional context for advanced significance computation */
export interface SignificanceContext {
  /** Address is a known whale, exchange, or other labeled entity */
  isWhale?: boolean;
  /** USD-equivalent value of the event (e.g. transfer amount) */
  transferUsdValue?: number;
  /** Governance referendum stage (e.g. "deciding", "confirming") */
  governanceStage?: string;
}

/** USD value threshold for a whale-sized transfer (≈100K USD) */
const USD_MAJOR_THRESHOLD = 100_000;
const USD_NOTABLE_THRESHOLD = 10_000;

/**
 * Compute significance with additional multi-factor context.
 * Falls back to computeSignificance when no context is provided.
 * Backwards-compatible: calling without context is equivalent to calling
 * computeSignificance directly.
 */
export function computeAdvancedSignificance(
  eventType: EventType,
  data: Record<string, unknown>,
  context?: SignificanceContext,
): Significance {
  // Start from the base score
  let score: number = computeSignificance(eventType, data);

  if (!context) return score as Significance;

  const { isWhale, transferUsdValue, governanceStage } = context;

  // Whale transfers get +1 boost (capped at 2)
  if (isWhale && (eventType === "transfer" || eventType === "xcm_sent")) {
    score = Math.min(2, score + 1);
  }

  // Large treasury awards (>100K DOT) always Major
  if (eventType === "treasury_awarded") {
    const raw = data["amount"] ?? data["value"];
    if (raw !== undefined && raw !== null) {
      try {
        const amount = BigInt(raw as string | number | bigint);
        if (amount >= TREASURY_THRESHOLDS.major) {
          score = 2;
        }
      } catch {
        // non-parseable amount — leave score as-is
      }
    }
  }

  // USD-value boosting for transfers (exchange rates provided externally)
  if (
    transferUsdValue !== undefined &&
    (eventType === "transfer" || eventType === "swap_executed")
  ) {
    if (transferUsdValue >= USD_MAJOR_THRESHOLD) {
      score = Math.max(score, 2);
    } else if (transferUsdValue >= USD_NOTABLE_THRESHOLD) {
      score = Math.max(score, 1);
    }
  }

  // Active governance stages elevate significance
  if (
    governanceStage !== undefined &&
    (eventType === "governance_submitted" ||
      eventType === "governance_vote" ||
      eventType === "governance_confirmed" ||
      eventType === "governance_rejected")
  ) {
    const highStages = ["deciding", "confirming", "approved"];
    if (highStages.includes(governanceStage)) {
      score = Math.max(score, 1);
    }
  }

  return Math.min(2, Math.max(0, score)) as Significance;
}

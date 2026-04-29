import type { ChainId, EventType, Significance } from "@polkadot-feed/shared";
import { SIGNIFICANCE_THRESHOLDS } from "@polkadot-feed/shared";

export interface RawChainEvent {
  chainId: ChainId;
  blockNumber: number;
  timestamp: Date;
  pallet: string;
  method: string;
  data: Record<string, unknown>;
}

export interface NormalizedEvent {
  chainId: ChainId;
  blockNumber: number;
  timestamp: Date;
  eventType: EventType;
  pallet: string;
  method: string;
  accounts: string[];
  data: Record<string, unknown>;
  significance: Significance;
}

/** Map pallet.method to our unified event type */
const EVENT_TYPE_MAP: Record<string, EventType> = {
  "balances.Transfer": "transfer",
  "assets.Transferred": "transfer",
  "xcmPallet.Sent": "xcm_sent",
  "xcmPallet.Attempted": "xcm_sent",
  "messageQueue.Processed": "xcm_received",
  "messageQueue.ProcessingFailed": "xcm_failed",
  "referenda.Submitted": "governance_submitted",
  "referenda.Confirmed": "governance_confirmed",
  "referenda.Rejected": "governance_rejected",
  "convictionVoting.Voted": "governance_vote",
  "treasury.Awarded": "treasury_awarded",
  "staking.Rewarded": "staking_reward",
  "staking.Slashed": "staking_slash",
  "imOnline.SomeOffline": "validator_offline",
  "system.CodeUpdated": "runtime_upgrade",
  "identity.IdentitySet": "identity_set",
  "identity.IdentityCleared": "identity_cleared",
  "assetConversion.SwapExecuted": "swap_executed",
  "broker.Purchased": "coretime_purchased",
};

/** Extract account addresses from event data */
function extractAccounts(
  pallet: string,
  method: string,
  data: Record<string, unknown>,
): string[] {
  const accounts: string[] = [];

  const addressFields = ["from", "to", "who", "account", "sender", "recipient", "delegator", "validator"];
  for (const field of addressFields) {
    const val = data[field];
    if (typeof val === "string" && val.length > 0) {
      accounts.push(val);
    }
  }

  return accounts;
}

/** Determine significance based on event type and data */
function calculateSignificance(
  eventType: EventType,
  data: Record<string, unknown>,
): Significance {
  // Major events
  if (
    eventType === "staking_slash" ||
    eventType === "runtime_upgrade" ||
    eventType === "xcm_failed" ||
    eventType === "governance_confirmed" ||
    eventType === "governance_rejected"
  ) {
    return 2;
  }

  // Notable events
  if (
    eventType === "governance_submitted" ||
    eventType === "validator_offline" ||
    eventType === "coretime_purchased"
  ) {
    return 1;
  }

  // Transfer significance by amount
  if (eventType === "transfer") {
    const amount = data["amount"];
    if (typeof amount === "bigint" || typeof amount === "number" || typeof amount === "string") {
      const value = BigInt(amount);
      if (value >= SIGNIFICANCE_THRESHOLDS.major) return 2;
      if (value >= SIGNIFICANCE_THRESHOLDS.notable) return 1;
    }
  }

  return 0;
}

/** Normalize a raw chain event to our unified schema */
export function normalizeEvent(raw: RawChainEvent): NormalizedEvent | null {
  const key = `${raw.pallet}.${raw.method}`;
  const eventType = EVENT_TYPE_MAP[key];

  if (!eventType) {
    return null; // Event type not tracked
  }

  const accounts = extractAccounts(raw.pallet, raw.method, raw.data);
  const significance = calculateSignificance(eventType, raw.data);

  return {
    chainId: raw.chainId,
    blockNumber: raw.blockNumber,
    timestamp: raw.timestamp,
    eventType,
    pallet: raw.pallet,
    method: raw.method,
    accounts,
    data: raw.data,
    significance,
  };
}

/** Check if a pallet.method combination is one we track */
export function isTrackedEvent(pallet: string, method: string): boolean {
  return `${pallet}.${method}` in EVENT_TYPE_MAP;
}

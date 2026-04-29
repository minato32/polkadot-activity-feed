import type { EventCategory, EventType } from "./types.js";

/** Event category to event type mapping */
export const CATEGORY_EVENT_TYPES: Record<EventCategory, EventType[]> = {
  transfers: ["transfer"],
  xcm: ["xcm_sent", "xcm_received", "xcm_failed"],
  governance: [
    "governance_submitted",
    "governance_vote",
    "governance_confirmed",
    "governance_rejected",
    "treasury_awarded",
  ],
  staking: ["staking_reward", "staking_slash", "validator_offline"],
  runtime: ["runtime_upgrade"],
  identity: ["identity_set", "identity_cleared"],
  defi: ["swap_executed"],
  parachains: ["coretime_purchased"],
};

/** All event categories */
export const EVENT_CATEGORIES: EventCategory[] = [
  "transfers",
  "xcm",
  "governance",
  "staking",
  "runtime",
  "identity",
  "defi",
  "parachains",
];

/** Significance labels */
export const SIGNIFICANCE_LABELS = ["Normal", "Notable", "Major"] as const;

/** Default pagination limit */
export const DEFAULT_PAGE_SIZE = 50;

/** Maximum pagination limit */
export const MAX_PAGE_SIZE = 200;

/** WebSocket heartbeat interval (ms) */
export const WS_HEARTBEAT_INTERVAL = 30_000;

/** WebSocket reconnect base delay (ms) */
export const WS_RECONNECT_BASE_DELAY = 1_000;

/** WebSocket reconnect max delay (ms) */
export const WS_RECONNECT_MAX_DELAY = 30_000;

/** Transfer significance thresholds (in native token base units) */
export const SIGNIFICANCE_THRESHOLDS = {
  /** Transfers above this are Notable (10K DOT = 10K * 10^10 planck) */
  notable: 100_000_000_000_000n,
  /** Transfers above this are Major (100K DOT) */
  major: 1_000_000_000_000_000n,
} as const;

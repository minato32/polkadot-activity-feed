/** Event category → event type mapping */
export const CATEGORY_EVENT_TYPES: Record<string, string[]> = {
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

/** Significance labels */
export const SIGNIFICANCE_LABELS = ["Normal", "Notable", "Major"] as const;

/** Default pagination limit */
export const DEFAULT_PAGE_SIZE = 50;

/** WebSocket heartbeat interval (ms) */
export const WS_HEARTBEAT_INTERVAL = 30_000;

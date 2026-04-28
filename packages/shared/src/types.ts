/** Unified event schema matching the PostgreSQL events table */
export interface ChainEvent {
  id: string;
  chainId: string;
  blockNumber: number;
  timestamp: string;
  eventType: EventType;
  pallet: string;
  method: string;
  accounts: string[];
  data: Record<string, unknown>;
  significance: Significance;
  createdAt: string;
}

export type EventType =
  | "transfer"
  | "xcm_sent"
  | "xcm_received"
  | "xcm_failed"
  | "governance_submitted"
  | "governance_vote"
  | "governance_confirmed"
  | "governance_rejected"
  | "treasury_awarded"
  | "staking_reward"
  | "staking_slash"
  | "validator_offline"
  | "runtime_upgrade"
  | "identity_set"
  | "identity_cleared"
  | "swap_executed"
  | "coretime_purchased";

export type Significance = 0 | 1 | 2;

export type EventCategory =
  | "transfers"
  | "xcm"
  | "governance"
  | "staking"
  | "runtime"
  | "identity"
  | "defi"
  | "parachains";

export interface EventFilter {
  chains?: string[];
  eventTypes?: EventType[];
  categories?: EventCategory[];
  minSignificance?: Significance;
  accounts?: string[];
  limit?: number;
  cursor?: string;
}

export interface PaginatedEvents {
  events: ChainEvent[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ChainConfig {
  id: string;
  name: string;
  wsEndpoint: string;
  logo?: string;
  color: string;
}

export interface WebSocketMessage {
  type: "new_event" | "subscribe" | "unsubscribe" | "ping" | "pong";
  payload: unknown;
}

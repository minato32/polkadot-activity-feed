/** MVP chain identifiers */
export type ChainId =
  | "polkadot"
  | "asset-hub"
  | "moonbeam"
  | "hydration"
  | "acala";

/** Unified event schema matching the PostgreSQL events table */
export interface ChainEvent {
  id: string;
  chainId: ChainId;
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

/** All trackable event types across the ecosystem */
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

/** Significance levels: 0=Normal, 1=Notable, 2=Major */
export type Significance = 0 | 1 | 2;

/** Event categories grouping related event types */
export type EventCategory =
  | "transfers"
  | "xcm"
  | "governance"
  | "staking"
  | "runtime"
  | "identity"
  | "defi"
  | "parachains";

/** Chain configuration for connecting to and displaying a parachain */
export interface ChainConfig {
  id: ChainId;
  name: string;
  displayName: string;
  wsEndpoint: string;
  ss58Prefix: number;
  nativeToken: string;
  decimals: number;
  color: string;
  logo?: string;
}

/** Filter criteria for querying events */
export interface EventFilter {
  chains?: ChainId[];
  eventTypes?: EventType[];
  categories?: EventCategory[];
  minSignificance?: Significance;
  minAmount?: number;
  accounts?: string[];
  limit?: number;
  cursor?: string;
}

/** Generic paginated response for cursor-based pagination */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Paginated events (convenience alias) */
export type PaginatedEvents = PaginatedResponse<ChainEvent>;

/** WebSocket message types for client-server communication */
export interface WebSocketMessage {
  type: "new_event" | "subscribe" | "unsubscribe" | "ping" | "pong";
  payload: unknown;
}

/** WebSocket subscription request payload */
export interface SubscribePayload {
  chains?: ChainId[];
  eventTypes?: EventType[];
  minSignificance?: Significance;
}

/** Row shape from PostgreSQL events table (snake_case) */
export interface EventRow {
  id: string;
  chain_id: string;
  block_number: string;
  timestamp: string;
  event_type: string;
  pallet: string;
  method: string;
  accounts: string[];
  data: Record<string, unknown>;
  significance: number;
  created_at: string;
}

// ─── User & Auth Types ────────────────────────────────────────────────────────

/** Subscription tier controlling feature access and limits */
export type UserTier = "free" | "pro" | "whale" | "enterprise";

/** Per-tier limits for wallets and presets */
export interface TierLimits {
  wallets: number | null; // null = unlimited
  presets: number | null; // null = unlimited
}

/** Registered user with wallet-based identity */
export interface User {
  id: string;
  address: string; // SS58-encoded wallet address
  displayName: string | null;
  tier: UserTier;
  createdAt: string;
}

/** A wallet the user is tracking */
export interface FollowedWallet {
  id: string;
  userId: string;
  address: string;
  label: string | null;
  chainId: ChainId | null;
  createdAt: string;
}

/** A saved filter configuration the user can reuse */
export interface FilterPreset {
  id: string;
  userId: string;
  name: string;
  filters: EventFilter;
  isDefault: boolean;
  createdAt: string;
}

/** Supported notification delivery channels */
export type NotificationChannel = "telegram" | "discord";

/** A notification config linking a user, channel, and preset */
export interface NotificationConfig {
  id: string;
  userId: string;
  channel: NotificationChannel;
  presetId: string;
  config: NotificationChannelConfig;
  enabled: boolean;
  createdAt: string;
}

/** Channel-specific config (discriminated by the NotificationChannel field) */
export type NotificationChannelConfig =
  | { chatId: string }
  | { webhookUrl: string };

/** Request payload for wallet-challenge auth flow */
export interface AuthPayload {
  address: string;
  signature: string;
  message: string;
}

/** Response returned after successful authentication */
export interface AuthResponse {
  token: string;
  user: User;
}

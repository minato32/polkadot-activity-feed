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

// ─── Intelligence Types ───────────────────────────────────────────────────────

/** Category of a whale/notable address label */
export type LabelCategory =
  | "exchange"
  | "treasury"
  | "validator"
  | "fund"
  | "bridge"
  | "team";

/** Known address label (whale tagging) */
export interface WhaleLabel {
  id: string;
  address: string;
  label: string;
  category: LabelCategory;
  source: "official" | "community";
  verified: boolean;
  createdAt: string;
}

/** Cross-chain message correlation record */
export interface XcmCorrelation {
  id: string;
  sourceChainId: ChainId;
  sourceEventId: string;
  destChainId: ChainId;
  destEventId: string | null;
  messageHash: string;
  status: "pending" | "matched" | "failed";
  createdAt: string;
}

/** Aggregation of clustered events within a time window */
export interface EventAggregation {
  id: string;
  eventType: EventType;
  chainId?: ChainId;
  timeWindowStart: string;
  timeWindowEnd: string;
  eventCount: number;
  summary: string;
  significance: Significance;
  eventIds: string[];
}

/** User digest delivery configuration */
export interface DigestConfig {
  id: string;
  userId: string;
  frequency: "daily" | "weekly";
  email?: string;
  telegramChatId?: string;
  enabled: boolean;
  createdAt: string;
}

/** A single generated digest entry */
export interface DigestEntry {
  id: string;
  digestConfigId: string;
  generatedAt: string;
  deliveredAt: string | null;
  eventCount: number;
  topEvents: ChainEvent[];
}

/** Governance context enriched from on-chain or external data */
export interface GovernanceContext {
  referendumIndex: number;
  title: string | null;
  track: string | null;
  currentTally: {
    ayes: string;
    nays: string;
  } | null;
  status: string | null;
}

// ─── Scale & Polish Types ─────────────────────────────────────────────────────

/** Extended chain identifiers including parachains beyond the MVP set */
export type ExpandedChainId =
  | ChainId
  | "astar"
  | "phala"
  | "interlay"
  | "centrifuge"
  | "bifrost"
  | "zeitgeist"
  | "pendulum"
  | "unique"
  | "kilt"
  | "nodle";

/** Date range filter with ISO 8601 string boundaries */
export interface DateRange {
  from: string;
  to: string;
}

/** Amount range filter in native token base units */
export interface AmountRange {
  min?: number;
  max?: number;
}

/** Full-text + faceted search query */
export interface SearchQuery {
  query?: string;
  filters?: {
    chains?: ExpandedChainId[];
    eventTypes?: EventType[];
    dateRange?: DateRange;
    amountRange?: AmountRange;
  };
  pagination?: {
    limit?: number;
    cursor?: string;
  };
}

/** Supported export formats */
export type ExportFormat = "csv";

/** Request parameters for exporting events */
export interface ExportRequest {
  chains?: ExpandedChainId[];
  eventTypes?: EventType[];
  dateRange?: DateRange;
  format: ExportFormat;
}

/** Developer API key with tier-based rate limiting */
export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  name: string;
  tier: UserTier;
  requestsToday: number;
  requestsLimit: number;
  createdAt: string;
}

/** Webhook delivery configuration for a user */
export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  secret: string;
  presetId: string | null;
  enabled: boolean;
  createdAt: string;
}

/** Record of a single webhook delivery attempt */
export interface WebhookDelivery {
  id: string;
  webhookConfigId: string;
  eventId: string;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  lastAttemptAt: string | null;
  createdAt: string;
}

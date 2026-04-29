import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import type { ChainConfig, ExpandedChainId } from "@polkadot-feed/shared";
import { MVP_CHAINS, type ExpandedChainConfig } from "@polkadot-feed/shared";

export interface ChainStatus {
  chainId: ExpandedChainId;
  connected: boolean;
  lastBlockSeen: number | null;
  lastError: string | null;
  reconnectAttempts: number;
}

interface ChainConnection {
  config: ChainConfig | ExpandedChainConfig;
  client: ReturnType<typeof createClient>;
  provider: ReturnType<typeof getWsProvider>;
  status: ChainStatus;
}

const connections = new Map<ExpandedChainId, ChainConnection>();

// Reserved for future reconnection logic
// const MAX_RECONNECT_DELAY = 30_000;
// const BASE_RECONNECT_DELAY = 1_000;

/** Connect to a single chain via PAPI WebSocket */
export function connectChain(config: ChainConfig | ExpandedChainConfig): ChainConnection {
  const status: ChainStatus = {
    chainId: config.id,
    connected: false,
    lastBlockSeen: null,
    lastError: null,
    reconnectAttempts: 0,
  };

  const provider = getWsProvider(config.wsEndpoint);
  const client = createClient(provider);

  const connection: ChainConnection = { config, client, provider, status };
  connections.set(config.id, connection);

  status.connected = true;
  status.reconnectAttempts = 0;
  console.log(`Chain ${config.name}: connected`);

  return connection;
}

/**
 * Connect to a dynamic list of chains.
 * Defaults to MVP_CHAINS when no list is provided.
 */
export function connectChains(chains: (ChainConfig | ExpandedChainConfig)[] = MVP_CHAINS): void {
  for (const config of chains) {
    try {
      connectChain(config);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Chain ${config.name}: failed to connect — ${msg}`);
    }
  }
}

/** Connect to all MVP chains (backward-compatible alias) */
export function connectAllChains(): void {
  connectChains(MVP_CHAINS);
}

/** Get PAPI client for a specific chain */
export function getClient(chainId: ExpandedChainId): ReturnType<typeof createClient> {
  const conn = connections.get(chainId);
  if (!conn) {
    throw new Error(`No connection for chain: ${chainId}`);
  }
  return conn.client;
}

/** Get connection status for a specific chain */
export function getChainStatus(chainId: ExpandedChainId): ChainStatus | undefined {
  return connections.get(chainId)?.status;
}

/** Get status of all connected chains */
export function getAllChainStatuses(): ChainStatus[] {
  return Array.from(connections.values()).map((c) => c.status);
}

/** Update last seen block for a chain */
export function updateLastBlock(chainId: ExpandedChainId, blockNumber: number): void {
  const conn = connections.get(chainId);
  if (conn) {
    conn.status.lastBlockSeen = blockNumber;
  }
}

/** Disconnect all chains gracefully */
export async function disconnectAllChains(): Promise<void> {
  for (const [, conn] of connections) {
    try {
      conn.client.destroy();
      conn.status.connected = false;
      console.log(`Chain ${conn.config.name}: disconnected`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Chain ${conn.config.name}: error during disconnect — ${msg}`);
    }
  }
  connections.clear();
}

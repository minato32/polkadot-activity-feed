import type { ChainId } from "@polkadot-feed/shared";
import { MVP_CHAINS } from "@polkadot-feed/shared";
import { getClient, updateLastBlock } from "./chain-connection.js";
import { normalizeEvent, type RawChainEvent } from "../handlers/event-normalizer.js";
import { insertEvent } from "./event-store.js";
import { publishEvent } from "./redis.js";
import { recordXcmSent, matchXcmReceived } from "./xcm-correlation.js";
import { enrichGovernanceEvent } from "./governance.js";

/** Active subscription cleanup functions */
const subscriptions = new Map<ChainId, () => void>();

/** Start ingesting events from a single chain */
export async function startChainIngestion(chainId: ChainId): Promise<void> {
  const client = getClient(chainId);

  console.log(`Ingestion ${chainId}: starting block subscription`);

  const unsub = client.finalizedBlock$.subscribe({
    next: async (block) => {
      try {
        updateLastBlock(chainId, block.number);
        await processBlock(chainId, block.number, block.hash);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Ingestion ${chainId} block ${block.number}: ${msg}`);
      }
    },
    error: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Ingestion ${chainId}: subscription error — ${msg}`);
    },
  });

  subscriptions.set(chainId, () => unsub.unsubscribe());
}

/**
 * Process a finalized block — extract system events via RPC.
 * PAPI's getBlockBody returns raw hex; instead we fetch the block
 * header and use system events storage query at that block hash.
 */
async function processBlock(
  chainId: ChainId,
  blockNumber: number,
  _blockHash: string,
): Promise<void> {
  // TODO: Once typedApi descriptors are generated per chain,
  // use typedApi.query.System.Events.getValue() at blockHash
  // to get typed events. For now, log the block and skip processing.
  // The full event extraction requires chain-specific descriptors
  // which are generated via `polkadot-api` CLI per chain.
  console.log(`Ingestion ${chainId}: finalized block #${blockNumber}`);
}

/** Process raw events from a block (called when events are available) */
export async function processRawEvents(
  chainId: ChainId,
  blockNumber: number,
  events: Array<{ pallet: string; method: string; data: Record<string, unknown> }>,
): Promise<void> {
  const timestamp = new Date();

  for (const event of events) {
    const raw: RawChainEvent = {
      chainId,
      blockNumber,
      timestamp,
      pallet: event.pallet,
      method: event.method,
      data: event.data,
    };

    const normalized = normalizeEvent(raw);
    if (!normalized) continue;

    // Enrich governance events with on-chain context before storage
    let governanceCtx = undefined;
    if (
      normalized.eventType === "governance_submitted" ||
      normalized.eventType === "governance_vote" ||
      normalized.eventType === "governance_confirmed" ||
      normalized.eventType === "governance_rejected"
    ) {
      governanceCtx = enrichGovernanceEvent(normalized);
    }

    try {
      const id = await insertEvent(normalized);

      const chainEvent = {
        id,
        ...normalized,
        timestamp: normalized.timestamp.toISOString(),
        createdAt: new Date().toISOString(),
        ...(governanceCtx ? { governanceContext: governanceCtx } : {}),
      };

      await publishEvent(chainId, JSON.stringify(chainEvent));

      // XCM correlation hooks
      const messageHash =
        typeof normalized.data["messageHash"] === "string"
          ? normalized.data["messageHash"]
          : null;

      if (normalized.eventType === "xcm_sent" && messageHash) {
        recordXcmSent(chainId, id, messageHash).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`XCM correlation recordSent failed: ${msg}`);
        });
      }

      if (normalized.eventType === "xcm_received" && messageHash) {
        matchXcmReceived(chainId, id, messageHash).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`XCM correlation matchReceived failed: ${msg}`);
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Ingestion ${chainId}: failed to store event — ${msg}`);
    }
  }
}

/** Start ingestion for all MVP chains */
export async function startAllIngestion(): Promise<void> {
  for (const chain of MVP_CHAINS) {
    try {
      await startChainIngestion(chain.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Ingestion ${chain.id}: failed to start — ${msg}`);
    }
  }
}

/** Stop all ingestion subscriptions */
export function stopAllIngestion(): void {
  for (const [chainId, unsub] of subscriptions) {
    unsub();
    console.log(`Ingestion ${chainId}: stopped`);
  }
  subscriptions.clear();
}

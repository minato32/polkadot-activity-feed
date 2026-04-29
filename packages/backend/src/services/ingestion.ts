import type { ChainId } from "@polkadot-feed/shared";
import { MVP_CHAINS } from "@polkadot-feed/shared";
import { getClient, updateLastBlock } from "./chain-connection.js";
import { normalizeEvent, type RawChainEvent } from "../handlers/event-normalizer.js";
import { insertEvent } from "./event-store.js";
import { publishEvent } from "./redis.js";

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
        await processBlock(chainId, block);
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

/** Process a finalized block — extract and normalize events */
async function processBlock(
  chainId: ChainId,
  block: { number: number; hash: string },
): Promise<void> {
  const client = getClient(chainId);
  const blockBody = await client.getBlockBody(block.hash);
  const timestamp = new Date(); // TODO: extract from timestamp pallet

  // Process events from the block body
  // PAPI provides events through the block body's events
  if (!blockBody) return;

  for (const extrinsic of blockBody) {
    const events = extrinsic.events ?? [];
    for (const event of events) {
      const raw: RawChainEvent = {
        chainId,
        blockNumber: block.number,
        timestamp,
        pallet: event.type.pallet ?? "unknown",
        method: event.type.method ?? "unknown",
        data: (event.value as Record<string, unknown>) ?? {},
      };

      const normalized = normalizeEvent(raw);
      if (!normalized) continue;

      try {
        const id = await insertEvent(normalized);

        const chainEvent = {
          id,
          ...normalized,
          timestamp: normalized.timestamp.toISOString(),
          createdAt: new Date().toISOString(),
        };

        await publishEvent(chainId, JSON.stringify(chainEvent));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Ingestion ${chainId}: failed to store event — ${msg}`);
      }
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

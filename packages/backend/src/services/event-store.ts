import type { ChainEvent, EventRow } from "@polkadot-feed/shared";
import type { NormalizedEvent } from "../handlers/event-normalizer.js";
import { query } from "./database.js";

/** Insert a normalized event into PostgreSQL */
export async function insertEvent(event: NormalizedEvent): Promise<string> {
  const result = await query(
    `INSERT INTO events (chain_id, block_number, timestamp, event_type, pallet, method, accounts, data, significance)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      event.chainId,
      event.blockNumber,
      event.timestamp.toISOString(),
      event.eventType,
      event.pallet,
      event.method,
      event.accounts,
      JSON.stringify(event.data),
      event.significance,
    ],
  );

  return result.rows[0].id;
}

/** Convert a database row to a ChainEvent */
export function rowToEvent(row: EventRow): ChainEvent {
  return {
    id: row.id,
    chainId: row.chain_id as ChainEvent["chainId"],
    blockNumber: Number(row.block_number),
    timestamp: row.timestamp,
    eventType: row.event_type as ChainEvent["eventType"],
    pallet: row.pallet,
    method: row.method,
    accounts: row.accounts,
    data: row.data,
    significance: row.significance as ChainEvent["significance"],
    createdAt: row.created_at,
  };
}

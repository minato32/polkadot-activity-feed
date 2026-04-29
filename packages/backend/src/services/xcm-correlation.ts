import type { XcmCorrelation, ChainId } from "@polkadot-feed/shared";
import { query } from "./database.js";

interface XcmCorrelationRow {
  id: string;
  source_chain_id: string;
  source_event_id: string;
  dest_chain_id: string;
  dest_event_id: string | null;
  message_hash: string;
  status: string;
  created_at: string;
}

function rowToCorrelation(row: XcmCorrelationRow): XcmCorrelation {
  return {
    id: row.id,
    sourceChainId: row.source_chain_id as ChainId,
    sourceEventId: row.source_event_id,
    destChainId: row.dest_chain_id as ChainId,
    destEventId: row.dest_event_id,
    messageHash: row.message_hash,
    status: row.status as XcmCorrelation["status"],
    createdAt: row.created_at,
  };
}

/** Record an outgoing XCM message — creates a pending correlation */
export async function recordXcmSent(
  sourceChainId: ChainId,
  eventId: string,
  messageHash: string,
): Promise<XcmCorrelation> {
  const result = await query<XcmCorrelationRow>(
    `INSERT INTO xcm_correlations (source_chain_id, source_event_id, dest_chain_id, message_hash, status)
     VALUES ($1, $2, '', $3, 'pending')
     RETURNING id, source_chain_id, source_event_id, dest_chain_id, dest_event_id, message_hash, status, created_at`,
    [sourceChainId, eventId, messageHash],
  );
  const row = result.rows[0];
  if (!row) throw new Error("XCM correlation insert failed");
  return rowToCorrelation(row);
}

/**
 * Match an incoming XCM receipt to a pending correlation.
 * Updates status to 'matched' and fills in dest_chain_id + dest_event_id.
 */
export async function matchXcmReceived(
  destChainId: ChainId,
  eventId: string,
  messageHash: string,
): Promise<XcmCorrelation | null> {
  const result = await query<XcmCorrelationRow>(
    `UPDATE xcm_correlations
     SET dest_chain_id = $1, dest_event_id = $2, status = 'matched'
     WHERE message_hash = $3 AND status = 'pending'
     RETURNING id, source_chain_id, source_event_id, dest_chain_id, dest_event_id, message_hash, status, created_at`,
    [destChainId, eventId, messageHash],
  );
  const row = result.rows[0];
  if (!row) return null;
  return rowToCorrelation(row);
}

/** Fetch a single correlation by id */
export async function getCorrelation(id: string): Promise<XcmCorrelation | null> {
  const result = await query<XcmCorrelationRow>(
    "SELECT id, source_chain_id, source_event_id, dest_chain_id, dest_event_id, message_hash, status, created_at FROM xcm_correlations WHERE id = $1",
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  return rowToCorrelation(row);
}

/** List unmatched pending correlations */
export async function getPendingCorrelations(): Promise<XcmCorrelation[]> {
  const result = await query<XcmCorrelationRow>(
    "SELECT id, source_chain_id, source_event_id, dest_chain_id, dest_event_id, message_hash, status, created_at FROM xcm_correlations WHERE status = 'pending' ORDER BY created_at DESC LIMIT 100",
  );
  return result.rows.map(rowToCorrelation);
}

/** List recent correlations (both matched and pending) */
export async function getRecentCorrelations(limit = 50): Promise<XcmCorrelation[]> {
  const result = await query<XcmCorrelationRow>(
    "SELECT id, source_chain_id, source_event_id, dest_chain_id, dest_event_id, message_hash, status, created_at FROM xcm_correlations ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
  return result.rows.map(rowToCorrelation);
}

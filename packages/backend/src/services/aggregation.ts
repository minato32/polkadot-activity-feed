import type { EventAggregation, EventType, ChainId, Significance } from "@polkadot-feed/shared";
import { query } from "./database.js";

interface AggregationRow {
  id: string;
  event_type: string;
  chain_id: string | null;
  time_window_start: string;
  time_window_end: string;
  event_count: number;
  summary: string;
  significance: number;
  event_ids: string[];
  created_at: string;
}

interface ClusterRow {
  event_type: string;
  chain_id: string | null;
  event_count: string;
  event_ids: string[];
  window_start: string;
  window_end: string;
  max_significance: number;
}

function rowToAggregation(row: AggregationRow): EventAggregation {
  return {
    id: row.id,
    eventType: row.event_type as EventType,
    chainId: (row.chain_id ?? undefined) as ChainId | undefined,
    timeWindowStart: row.time_window_start,
    timeWindowEnd: row.time_window_end,
    eventCount: row.event_count,
    summary: row.summary,
    significance: row.significance as Significance,
    eventIds: row.event_ids.map(String),
  };
}

/**
 * Scan recent events for clusters: same event_type with ≥3 events in the
 * given time window. Returns the detected clusters without persisting them.
 */
export async function detectClusters(
  timeWindowMinutes: number,
): Promise<ClusterRow[]> {
  const result = await query<ClusterRow>(
    `SELECT
       event_type,
       chain_id,
       COUNT(*) AS event_count,
       ARRAY_AGG(id ORDER BY block_number ASC) AS event_ids,
       MIN(timestamp) AS window_start,
       MAX(timestamp) AS window_end,
       MAX(significance) AS max_significance
     FROM events
     WHERE timestamp >= NOW() - ($1 || ' minutes')::INTERVAL
     GROUP BY event_type, chain_id
     HAVING COUNT(*) >= 3
     ORDER BY event_count DESC`,
    [timeWindowMinutes],
  );
  return result.rows;
}

/** Create an aggregation record from a detected cluster */
export async function createAggregation(
  eventType: EventType,
  chainId: ChainId | null,
  events: { id: string; timestamp: string },
  eventCount: number,
  timeWindowStart: string,
  timeWindowEnd: string,
  significance: Significance,
): Promise<EventAggregation> {
  const summary = `${eventCount} ${eventType.replace(/_/g, " ")} events${chainId ? ` on ${chainId}` : " across chains"} in time window`;

  const result = await query<AggregationRow>(
    `INSERT INTO event_aggregations
       (event_type, chain_id, time_window_start, time_window_end, event_count, summary, significance, event_ids)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, event_type, chain_id, time_window_start, time_window_end, event_count, summary, significance, event_ids, created_at`,
    [
      eventType,
      chainId ?? null,
      timeWindowStart,
      timeWindowEnd,
      eventCount,
      summary,
      significance,
      [events.id],
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Aggregation insert failed");
  return rowToAggregation(row);
}

/**
 * Detect clusters and persist them as aggregation records.
 * Returns the created aggregation entries.
 */
export async function detectAndStoreAggregations(
  timeWindowMinutes: number,
): Promise<EventAggregation[]> {
  const clusters = await detectClusters(timeWindowMinutes);
  const results: EventAggregation[] = [];

  for (const cluster of clusters) {
    const eventType = cluster.event_type as EventType;
    const chainId = (cluster.chain_id ?? null) as ChainId | null;
    const count = Number(cluster.event_count);
    const sig = Math.min(2, cluster.max_significance) as Significance;
    const summary = `${count} ${eventType.replace(/_/g, " ")} events${chainId ? ` on ${chainId}` : " across chains"} in ${timeWindowMinutes}m window`;

    const insertResult = await query<AggregationRow>(
      `INSERT INTO event_aggregations
         (event_type, chain_id, time_window_start, time_window_end, event_count, summary, significance, event_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, event_type, chain_id, time_window_start, time_window_end, event_count, summary, significance, event_ids, created_at`,
      [
        eventType,
        chainId,
        cluster.window_start,
        cluster.window_end,
        count,
        summary,
        sig,
        cluster.event_ids,
      ],
    );
    const row = insertResult.rows[0];
    if (row) results.push(rowToAggregation(row));
  }

  return results;
}

/** Fetch recent aggregation records */
export async function getRecentAggregations(limit = 20): Promise<EventAggregation[]> {
  const result = await query<AggregationRow>(
    "SELECT id, event_type, chain_id, time_window_start, time_window_end, event_count, summary, significance, event_ids, created_at FROM event_aggregations ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
  return result.rows.map(rowToAggregation);
}

/** Fetch a single aggregation by id */
export async function getAggregation(id: string): Promise<EventAggregation | null> {
  const result = await query<AggregationRow>(
    "SELECT id, event_type, chain_id, time_window_start, time_window_end, event_count, summary, significance, event_ids, created_at FROM event_aggregations WHERE id = $1",
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  return rowToAggregation(row);
}

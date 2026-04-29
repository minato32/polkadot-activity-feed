import type { DigestConfig, DigestEntry, ChainEvent } from "@polkadot-feed/shared";
import { query } from "./database.js";
import type { EventRow } from "@polkadot-feed/shared";

interface DigestConfigRow {
  id: string;
  user_id: string;
  frequency: string;
  email: string | null;
  telegram_chat_id: string | null;
  enabled: boolean;
  created_at: string;
}

interface DigestEntryRow {
  id: string;
  digest_config_id: string;
  generated_at: string;
  delivered_at: string | null;
  event_count: number;
  top_events: ChainEvent[];
}

function rowToConfig(row: DigestConfigRow): DigestConfig {
  return {
    id: row.id,
    userId: row.user_id,
    frequency: row.frequency as DigestConfig["frequency"],
    email: row.email ?? undefined,
    telegramChatId: row.telegram_chat_id ?? undefined,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

function rowToEntry(row: DigestEntryRow): DigestEntry {
  return {
    id: row.id,
    digestConfigId: row.digest_config_id,
    generatedAt: row.generated_at,
    deliveredAt: row.delivered_at,
    eventCount: row.event_count,
    topEvents: row.top_events,
  };
}

function eventRowToChainEvent(row: EventRow): ChainEvent {
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

/**
 * Generate a digest for the given config id.
 * Queries top events since the last digest (or 24h/7d based on frequency).
 */
export async function generateDigest(configId: string): Promise<DigestEntry | null> {
  const configResult = await query<DigestConfigRow>(
    "SELECT id, user_id, frequency, email, telegram_chat_id, enabled, created_at FROM digest_configs WHERE id = $1",
    [configId],
  );
  const config = configResult.rows[0];
  if (!config) return null;

  // Determine lookback window based on frequency
  const hours = config.frequency === "weekly" ? 168 : 24;

  // Find the last digest to avoid re-sending the same events
  const lastDigestResult = await query<{ generated_at: string }>(
    "SELECT generated_at FROM digest_entries WHERE digest_config_id = $1 ORDER BY generated_at DESC LIMIT 1",
    [configId],
  );
  const since = lastDigestResult.rows[0]?.generated_at
    ? `'${lastDigestResult.rows[0].generated_at}'::TIMESTAMPTZ`
    : `NOW() - INTERVAL '${hours} hours'`;

  // Fetch top 20 events by significance since last digest
  const eventsResult = await query<EventRow>(
    `SELECT id, chain_id, block_number, timestamp, event_type, pallet, method, accounts, data, significance, created_at
     FROM events
     WHERE created_at >= ${since}
     ORDER BY significance DESC, created_at DESC
     LIMIT 20`,
  );

  const topEvents = eventsResult.rows.map(eventRowToChainEvent);
  const eventCount = topEvents.length;

  const insertResult = await query<DigestEntryRow>(
    `INSERT INTO digest_entries (digest_config_id, event_count, top_events)
     VALUES ($1, $2, $3)
     RETURNING id, digest_config_id, generated_at, delivered_at, event_count, top_events`,
    [configId, eventCount, JSON.stringify(topEvents)],
  );
  const row = insertResult.rows[0];
  if (!row) throw new Error("Digest entry insert failed");
  return rowToEntry(row);
}

/**
 * Deliver a digest entry via the configured channel.
 * Currently a stub — logs the delivery intent. Wire up real channels later.
 */
export async function deliverDigest(entryId: string): Promise<boolean> {
  const entryResult = await query<DigestEntryRow & { user_id: string; email: string | null; telegram_chat_id: string | null }>(
    `SELECT de.id, de.digest_config_id, de.generated_at, de.delivered_at, de.event_count, de.top_events,
            dc.email, dc.telegram_chat_id
     FROM digest_entries de
     JOIN digest_configs dc ON dc.id = de.digest_config_id
     WHERE de.id = $1`,
    [entryId],
  );
  const entry = entryResult.rows[0];
  if (!entry) return false;

  // Stub delivery — log the intent and mark as delivered
  if (entry.telegram_chat_id) {
    console.log(`[digest] Telegram delivery to chat ${entry.telegram_chat_id} — ${entry.event_count} events (stub)`);
  }
  if (entry.email) {
    console.log(`[digest] Email delivery to ${entry.email} — ${entry.event_count} events (stub)`);
  }

  await query(
    "UPDATE digest_entries SET delivered_at = NOW() WHERE id = $1",
    [entryId],
  );
  return true;
}

/** Fetch digest history for a user */
export async function getDigestHistory(userId: string): Promise<DigestEntry[]> {
  const result = await query<DigestEntryRow>(
    `SELECT de.id, de.digest_config_id, de.generated_at, de.delivered_at, de.event_count, de.top_events
     FROM digest_entries de
     JOIN digest_configs dc ON dc.id = de.digest_config_id
     WHERE dc.user_id = $1
     ORDER BY de.generated_at DESC
     LIMIT 50`,
    [userId],
  );
  return result.rows.map(rowToEntry);
}

/** Get digest config for a user */
export async function getDigestConfig(userId: string): Promise<DigestConfig | null> {
  const result = await query<DigestConfigRow>(
    "SELECT id, user_id, frequency, email, telegram_chat_id, enabled, created_at FROM digest_configs WHERE user_id = $1",
    [userId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return rowToConfig(row);
}

/** Create or update digest config for a user */
export async function upsertDigestConfig(
  userId: string,
  frequency: DigestConfig["frequency"],
  email?: string,
  telegramChatId?: string,
  enabled = true,
): Promise<DigestConfig> {
  const result = await query<DigestConfigRow>(
    `INSERT INTO digest_configs (user_id, frequency, email, telegram_chat_id, enabled)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE
       SET frequency = EXCLUDED.frequency,
           email = EXCLUDED.email,
           telegram_chat_id = EXCLUDED.telegram_chat_id,
           enabled = EXCLUDED.enabled
     RETURNING id, user_id, frequency, email, telegram_chat_id, enabled, created_at`,
    [userId, frequency, email ?? null, telegramChatId ?? null, enabled],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Digest config upsert failed");
  return rowToConfig(row);
}

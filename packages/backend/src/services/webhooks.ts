import crypto from "node:crypto";
import type { ChainEvent, WebhookConfig, WebhookDelivery } from "@polkadot-feed/shared";
import { query } from "./database.js";

const MAX_ATTEMPTS = 3;

interface WebhookConfigRow {
  id: string;
  user_id: string;
  url: string;
  secret: string;
  preset_id: string | null;
  enabled: boolean;
  created_at: string;
}

interface WebhookDeliveryRow {
  id: string;
  webhook_config_id: string;
  event_id: string;
  status: string;
  attempts: number;
  last_attempt_at: string | null;
  created_at: string;
}

function rowToConfig(row: WebhookConfigRow): WebhookConfig {
  return {
    id: row.id,
    userId: row.user_id,
    url: row.url,
    secret: row.secret,
    presetId: row.preset_id,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

function rowToDelivery(row: WebhookDeliveryRow): WebhookDelivery {
  return {
    id: row.id,
    webhookConfigId: row.webhook_config_id,
    eventId: row.event_id,
    status: row.status as WebhookDelivery["status"],
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at,
    createdAt: row.created_at,
  };
}

/** Compute HMAC-SHA256 signature for the payload */
function computeSignature(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/** POST event payload to a webhook URL with HMAC signature header */
export async function deliverWebhook(
  config: WebhookConfig,
  event: ChainEvent,
): Promise<boolean> {
  const body = JSON.stringify({ event });
  const signature = computeSignature(config.secret, body);

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Polkadot-Feed-Signature": `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Create a pending delivery record and attempt to deliver it immediately */
export async function enqueueDelivery(
  webhookConfigId: string,
  event: ChainEvent,
): Promise<void> {
  const insertResult = await query<{ id: string }>(
    `INSERT INTO webhook_deliveries (webhook_config_id, event_id, status)
     VALUES ($1, $2, 'pending')
     RETURNING id`,
    [webhookConfigId, event.id],
  );

  const deliveryRow = insertResult.rows[0];
  if (!deliveryRow) return;

  const configResult = await query<WebhookConfigRow>(
    `SELECT id, user_id, url, secret, preset_id, enabled, created_at
     FROM webhook_configs WHERE id = $1 AND enabled = TRUE`,
    [webhookConfigId],
  );

  const configRow = configResult.rows[0];
  if (!configRow) return;

  const config = rowToConfig(configRow);
  const success = await deliverWebhook(config, event);

  await query(
    `UPDATE webhook_deliveries
     SET status = $1, attempts = 1, last_attempt_at = NOW()
     WHERE id = $2`,
    [success ? "delivered" : "failed", deliveryRow.id],
  );
}

/** Retry all failed deliveries with exponential backoff (max 3 attempts) */
export async function processWebhookQueue(): Promise<void> {
  const result = await query<WebhookDeliveryRow>(
    `SELECT wd.id, wd.webhook_config_id, wd.event_id, wd.status,
            wd.attempts, wd.last_attempt_at, wd.created_at
     FROM webhook_deliveries wd
     JOIN webhook_configs wc ON wc.id = wd.webhook_config_id
     WHERE wd.status = 'failed' AND wd.attempts < $1 AND wc.enabled = TRUE
     ORDER BY wd.created_at ASC
     LIMIT 100`,
    [MAX_ATTEMPTS],
  );

  for (const deliveryRow of result.rows) {
    const delivery = rowToDelivery(deliveryRow);

    // Exponential backoff: 1 min, 5 min, 25 min
    const backoffMs = Math.pow(5, delivery.attempts) * 60_000;
    const lastAttempt = delivery.lastAttemptAt
      ? new Date(delivery.lastAttemptAt).getTime()
      : 0;
    if (Date.now() - lastAttempt < backoffMs) continue;

    const configResult = await query<WebhookConfigRow>(
      `SELECT id, user_id, url, secret, preset_id, enabled, created_at
       FROM webhook_configs WHERE id = $1`,
      [delivery.webhookConfigId],
    );

    const configRow = configResult.rows[0];
    if (!configRow) continue;

    // We need the event — fetch from events table
    const eventResult = await query<{ id: string; chain_id: string; block_number: string; timestamp: string; event_type: string; pallet: string; method: string; accounts: string[]; data: Record<string, unknown>; significance: number; created_at: string }>(
      `SELECT * FROM events WHERE id = $1`,
      [delivery.eventId],
    );

    const eventRow = eventResult.rows[0];
    if (!eventRow) continue;

    const chainEvent: ChainEvent = {
      id: eventRow.id,
      chainId: eventRow.chain_id as ChainEvent["chainId"],
      blockNumber: Number(eventRow.block_number),
      timestamp: eventRow.timestamp,
      eventType: eventRow.event_type as ChainEvent["eventType"],
      pallet: eventRow.pallet,
      method: eventRow.method,
      accounts: eventRow.accounts,
      data: eventRow.data,
      significance: eventRow.significance as ChainEvent["significance"],
      createdAt: eventRow.created_at,
    };

    const config = rowToConfig(configRow);
    const success = await deliverWebhook(config, chainEvent);
    const newAttempts = delivery.attempts + 1;
    const newStatus =
      success ? "delivered" : newAttempts >= MAX_ATTEMPTS ? "failed" : "failed";

    await query(
      `UPDATE webhook_deliveries
       SET status = $1, attempts = $2, last_attempt_at = NOW()
       WHERE id = $3`,
      [newStatus, newAttempts, delivery.id],
    );
  }
}

/** Create a new webhook configuration */
export async function createWebhookConfig(
  userId: string,
  url: string,
  secret: string,
  presetId: string | null,
): Promise<WebhookConfig> {
  const result = await query<WebhookConfigRow>(
    `INSERT INTO webhook_configs (user_id, url, secret, preset_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, url, secret, preset_id, enabled, created_at`,
    [userId, url, secret, presetId],
  );

  const row = result.rows[0];
  if (!row) throw new Error("Failed to create webhook config");
  return rowToConfig(row);
}

/** List all webhook configs for a user */
export async function listWebhookConfigs(userId: string): Promise<WebhookConfig[]> {
  const result = await query<WebhookConfigRow>(
    `SELECT id, user_id, url, secret, preset_id, enabled, created_at
     FROM webhook_configs
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows.map(rowToConfig);
}

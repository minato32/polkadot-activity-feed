import type { FastifyInstance } from "fastify";
import type { WebhookDelivery } from "@polkadot-feed/shared";
import { requireAuth } from "../middleware/auth.js";
import { query } from "../services/database.js";
import {
  createWebhookConfig,
  listWebhookConfigs,
} from "../services/webhooks.js";

interface CreateWebhookBody {
  url: string;
  secret: string;
  presetId?: string;
}

interface UpdateWebhookBody {
  url?: string;
  enabled?: boolean;
}

interface WebhookParams {
  id: string;
}

interface DeliveryRow {
  id: string;
  webhook_config_id: string;
  event_id: string;
  status: string;
  attempts: number;
  last_attempt_at: string | null;
  created_at: string;
}

function rowToDelivery(row: DeliveryRow): WebhookDelivery {
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

export function registerWebhookRoutes(app: FastifyInstance): void {
  /** GET /api/webhooks — list caller's webhook configs */
  app.get(
    "/api/webhooks",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const configs = await listWebhookConfigs(request.user!.userId);
      return reply.send(configs);
    },
  );

  /** POST /api/webhooks — create a new webhook config */
  app.post<{ Body: CreateWebhookBody }>(
    "/api/webhooks",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { url, secret, presetId } = request.body;

      if (!url || typeof url !== "string") {
        return reply.code(400).send({ error: "url is required" });
      }
      if (!secret || typeof secret !== "string") {
        return reply.code(400).send({ error: "secret is required" });
      }

      const config = await createWebhookConfig(
        request.user!.userId,
        url,
        secret,
        presetId ?? null,
      );

      return reply.code(201).send(config);
    },
  );

  /** PUT /api/webhooks/:id — update url or enabled state */
  app.put<{ Params: WebhookParams; Body: UpdateWebhookBody }>(
    "/api/webhooks/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { url, enabled } = request.body;
      const updates: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (url !== undefined) {
        updates.push(`url = $${paramIdx}`);
        params.push(url);
        paramIdx++;
      }
      if (enabled !== undefined) {
        updates.push(`enabled = $${paramIdx}`);
        params.push(enabled);
        paramIdx++;
      }

      if (updates.length === 0) {
        return reply.code(400).send({ error: "No updatable fields provided" });
      }

      params.push(request.params.id, request.user!.userId);
      const result = await query<{ id: string }>(
        `UPDATE webhook_configs
         SET ${updates.join(", ")}
         WHERE id = $${paramIdx} AND user_id = $${paramIdx + 1}
         RETURNING id`,
        params,
      );

      const row = result.rows[0];
      if (!row) {
        return reply.code(404).send({ error: "Webhook not found" });
      }

      return reply.send({ id: row.id, updated: true });
    },
  );

  /** DELETE /api/webhooks/:id — remove a webhook config */
  app.delete<{ Params: WebhookParams }>(
    "/api/webhooks/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await query<{ id: string }>(
        `DELETE FROM webhook_configs WHERE id = $1 AND user_id = $2 RETURNING id`,
        [request.params.id, request.user!.userId],
      );

      const row = result.rows[0];
      if (!row) {
        return reply.code(404).send({ error: "Webhook not found" });
      }

      return reply.code(204).send();
    },
  );

  /** GET /api/webhooks/:id/deliveries — delivery history for a config */
  app.get<{ Params: WebhookParams }>(
    "/api/webhooks/:id/deliveries",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      // Verify ownership first
      const ownerResult = await query<{ id: string }>(
        `SELECT id FROM webhook_configs WHERE id = $1 AND user_id = $2`,
        [request.params.id, request.user!.userId],
      );
      if (!ownerResult.rows[0]) {
        return reply.code(404).send({ error: "Webhook not found" });
      }

      const result = await query<DeliveryRow>(
        `SELECT id, webhook_config_id, event_id, status, attempts,
                last_attempt_at, created_at
         FROM webhook_deliveries
         WHERE webhook_config_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [request.params.id],
      );

      return reply.send(result.rows.map(rowToDelivery));
    },
  );
}

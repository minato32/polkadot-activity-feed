import type { FastifyInstance } from "fastify";
import type { NotificationConfig, NotificationChannel, NotificationChannelConfig } from "@polkadot-feed/shared";
import { query } from "../services/database.js";
import { requireAuth } from "../middleware/auth.js";

interface NotificationConfigRow {
  id: string;
  user_id: string;
  channel: string;
  preset_id: string;
  config: NotificationChannelConfig;
  enabled: boolean;
  created_at: string;
}

interface CreateNotificationBody {
  channel: NotificationChannel;
  presetId: string;
  config: NotificationChannelConfig;
}

interface UpdateNotificationBody {
  channel?: NotificationChannel;
  presetId?: string;
  config?: NotificationChannelConfig;
  enabled?: boolean;
}

interface NotificationParams {
  id: string;
}

function rowToNotification(row: NotificationConfigRow): NotificationConfig {
  return {
    id: row.id,
    userId: row.user_id,
    channel: row.channel as NotificationChannel,
    presetId: row.preset_id,
    config: row.config,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

export function registerNotificationRoutes(app: FastifyInstance): void {
  /** GET /api/notifications — list user's notification configs */
  app.get(
    "/api/notifications",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await query<NotificationConfigRow>(
        "SELECT id, user_id, channel, preset_id, config, enabled, created_at FROM notification_configs WHERE user_id = $1 ORDER BY created_at DESC",
        [request.user!.userId],
      );
      return reply.send(result.rows.map(rowToNotification));
    },
  );

  /** POST /api/notifications — create a notification config */
  app.post<{ Body: CreateNotificationBody }>(
    "/api/notifications",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { channel, presetId, config } = request.body;

      if (!channel || !presetId || !config) {
        return reply.code(400).send({ error: "channel, presetId, and config are required" });
      }

      // Verify the preset belongs to this user
      const presetCheck = await query(
        "SELECT id FROM filter_presets WHERE id = $1 AND user_id = $2",
        [presetId, request.user!.userId],
      );
      if (presetCheck.rows.length === 0) {
        return reply.code(404).send({ error: "Preset not found or not owned by user" });
      }

      const result = await query<NotificationConfigRow>(
        `INSERT INTO notification_configs (user_id, channel, preset_id, config)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, channel, preset_id, config, enabled, created_at`,
        [request.user!.userId, channel, presetId, JSON.stringify(config)],
      );

      const row = result.rows[0];
      if (!row) return reply.code(500).send({ error: "Insert failed" });

      return reply.code(201).send(rowToNotification(row));
    },
  );

  /** PUT /api/notifications/:id — update a notification config */
  app.put<{ Params: NotificationParams; Body: UpdateNotificationBody }>(
    "/api/notifications/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params;
      const { channel, presetId, config, enabled } = request.body;

      const existing = await query(
        "SELECT id FROM notification_configs WHERE id = $1 AND user_id = $2",
        [id, request.user!.userId],
      );
      if (existing.rows.length === 0) {
        return reply.code(404).send({ error: "Notification config not found or not owned by user" });
      }

      const updates: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      if (channel !== undefined) {
        updates.push(`channel = $${idx}`);
        params.push(channel);
        idx++;
      }
      if (presetId !== undefined) {
        updates.push(`preset_id = $${idx}`);
        params.push(presetId);
        idx++;
      }
      if (config !== undefined) {
        updates.push(`config = $${idx}`);
        params.push(JSON.stringify(config));
        idx++;
      }
      if (enabled !== undefined) {
        updates.push(`enabled = $${idx}`);
        params.push(enabled);
        idx++;
      }

      if (updates.length === 0) {
        return reply.code(400).send({ error: "No fields to update" });
      }

      params.push(id, request.user!.userId);
      const result = await query<NotificationConfigRow>(
        `UPDATE notification_configs SET ${updates.join(", ")}
         WHERE id = $${idx} AND user_id = $${idx + 1}
         RETURNING id, user_id, channel, preset_id, config, enabled, created_at`,
        params,
      );

      const row = result.rows[0];
      if (!row) return reply.code(404).send({ error: "Notification config not found" });

      return reply.send(rowToNotification(row));
    },
  );

  /** DELETE /api/notifications/:id — delete a notification config */
  app.delete<{ Params: NotificationParams }>(
    "/api/notifications/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await query(
        "DELETE FROM notification_configs WHERE id = $1 AND user_id = $2 RETURNING id",
        [request.params.id, request.user!.userId],
      );

      if (result.rowCount === 0) {
        return reply.code(404).send({ error: "Notification config not found or not owned by user" });
      }

      return reply.code(204).send();
    },
  );
}

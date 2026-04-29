import type { FastifyInstance } from "fastify";
import type { FilterPreset, UserTier, TierLimits, EventFilter } from "@polkadot-feed/shared";
import { query } from "../services/database.js";
import { requireAuth } from "../middleware/auth.js";

const PRESET_LIMITS: Record<UserTier, TierLimits["presets"]> = {
  free: 3,
  pro: null,
  whale: null,
  enterprise: null,
};

interface PresetRow {
  id: string;
  user_id: string;
  name: string;
  filters: EventFilter;
  is_default: boolean;
  created_at: string;
}

interface CreatePresetBody {
  name: string;
  filters: EventFilter;
  isDefault?: boolean;
}

interface UpdatePresetBody {
  name?: string;
  filters?: EventFilter;
  isDefault?: boolean;
}

interface PresetParams {
  id: string;
}

function rowToPreset(row: PresetRow): FilterPreset {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    filters: row.filters,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

export function registerPresetRoutes(app: FastifyInstance): void {
  /** GET /api/presets — list user's filter presets */
  app.get(
    "/api/presets",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await query<PresetRow>(
        "SELECT id, user_id, name, filters, is_default, created_at FROM filter_presets WHERE user_id = $1 ORDER BY created_at DESC",
        [request.user!.userId],
      );
      return reply.send(result.rows.map(rowToPreset));
    },
  );

  /** POST /api/presets — create a new filter preset */
  app.post<{ Body: CreatePresetBody }>(
    "/api/presets",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { name, filters, isDefault = false } = request.body;

      if (!name || typeof name !== "string") {
        return reply.code(400).send({ error: "name is required" });
      }
      if (!filters || typeof filters !== "object") {
        return reply.code(400).send({ error: "filters is required" });
      }

      const tier = request.user!.tier as UserTier;
      const limit = PRESET_LIMITS[tier];

      if (limit !== null) {
        const countResult = await query<{ count: string }>(
          "SELECT COUNT(*) AS count FROM filter_presets WHERE user_id = $1",
          [request.user!.userId],
        );
        const count = Number(countResult.rows[0]?.count ?? 0);
        if (count >= limit) {
          return reply.code(403).send({
            error: `Tier limit reached. ${tier} accounts may have up to ${limit} presets.`,
          });
        }
      }

      // Clear existing default if the new preset is default
      if (isDefault) {
        await query(
          "UPDATE filter_presets SET is_default = FALSE WHERE user_id = $1",
          [request.user!.userId],
        );
      }

      const result = await query<PresetRow>(
        `INSERT INTO filter_presets (user_id, name, filters, is_default)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, name, filters, is_default, created_at`,
        [request.user!.userId, name, JSON.stringify(filters), isDefault],
      );

      const row = result.rows[0];
      if (!row) return reply.code(500).send({ error: "Insert failed" });

      return reply.code(201).send(rowToPreset(row));
    },
  );

  /** PUT /api/presets/:id — update a preset */
  app.put<{ Params: PresetParams; Body: UpdatePresetBody }>(
    "/api/presets/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { name, filters, isDefault } = request.body;
      const { id } = request.params;

      // Verify ownership
      const existing = await query<PresetRow>(
        "SELECT id FROM filter_presets WHERE id = $1 AND user_id = $2",
        [id, request.user!.userId],
      );
      if (existing.rows.length === 0) {
        return reply.code(404).send({ error: "Preset not found or not owned by user" });
      }

      if (isDefault === true) {
        await query(
          "UPDATE filter_presets SET is_default = FALSE WHERE user_id = $1",
          [request.user!.userId],
        );
      }

      const updates: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      if (name !== undefined) {
        updates.push(`name = $${idx}`);
        params.push(name);
        idx++;
      }
      if (filters !== undefined) {
        updates.push(`filters = $${idx}`);
        params.push(JSON.stringify(filters));
        idx++;
      }
      if (isDefault !== undefined) {
        updates.push(`is_default = $${idx}`);
        params.push(isDefault);
        idx++;
      }

      if (updates.length === 0) {
        return reply.code(400).send({ error: "No fields to update" });
      }

      params.push(id, request.user!.userId);
      const result = await query<PresetRow>(
        `UPDATE filter_presets SET ${updates.join(", ")}
         WHERE id = $${idx} AND user_id = $${idx + 1}
         RETURNING id, user_id, name, filters, is_default, created_at`,
        params,
      );

      const row = result.rows[0];
      if (!row) return reply.code(404).send({ error: "Preset not found" });

      return reply.send(rowToPreset(row));
    },
  );

  /** DELETE /api/presets/:id — delete a preset */
  app.delete<{ Params: PresetParams }>(
    "/api/presets/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await query(
        "DELETE FROM filter_presets WHERE id = $1 AND user_id = $2 RETURNING id",
        [request.params.id, request.user!.userId],
      );

      if (result.rowCount === 0) {
        return reply.code(404).send({ error: "Preset not found or not owned by user" });
      }

      return reply.code(204).send();
    },
  );
}

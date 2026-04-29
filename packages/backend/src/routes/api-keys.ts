import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { ApiKey } from "@polkadot-feed/shared";
import { requireAuth } from "../middleware/auth.js";
import { query } from "../services/database.js";

interface ApiKeyRow {
  id: string;
  user_id: string;
  key: string;
  name: string;
  tier: string;
  requests_today: number;
  requests_limit: number;
  created_at: string;
}

interface CreateKeyBody {
  name: string;
}

interface DeleteKeyParams {
  id: string;
}

/** Request limits per tier */
const TIER_LIMITS: Record<string, number> = {
  pro: 1_000,
  whale: 50_000,
  enterprise: 500_000,
};

function rowToApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    userId: row.user_id,
    key: row.key,
    name: row.name,
    tier: row.tier as ApiKey["tier"],
    requestsToday: row.requests_today,
    requestsLimit: row.requests_limit,
    createdAt: row.created_at,
  };
}

export function registerApiKeyRoutes(app: FastifyInstance): void {
  /** GET /api/keys — list caller's API keys */
  app.get(
    "/api/keys",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await query<ApiKeyRow>(
        `SELECT id, user_id, key, name, tier, requests_today, requests_limit, created_at
         FROM api_keys
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [request.user!.userId],
      );
      return reply.send(result.rows.map(rowToApiKey));
    },
  );

  /** POST /api/keys — generate a new API key (pro+ tier only) */
  app.post<{ Body: CreateKeyBody }>(
    "/api/keys",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const tier = request.user!.tier;

      if (tier === "free") {
        return reply
          .code(403)
          .send({ error: "API key access requires a pro or higher subscription" });
      }

      const { name } = request.body;
      if (!name || typeof name !== "string") {
        return reply.code(400).send({ error: "name is required" });
      }

      const key = crypto.randomBytes(32).toString("hex");
      const requestsLimit = TIER_LIMITS[tier] ?? TIER_LIMITS["pro"]!;

      const result = await query<ApiKeyRow>(
        `INSERT INTO api_keys (user_id, key, name, tier, requests_limit)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, key, name, tier, requests_today, requests_limit, created_at`,
        [request.user!.userId, key, name, tier, requestsLimit],
      );

      const row = result.rows[0];
      if (!row) {
        return reply.code(500).send({ error: "Failed to create API key" });
      }

      return reply.code(201).send(rowToApiKey(row));
    },
  );

  /** DELETE /api/keys/:id — revoke a key */
  app.delete<{ Params: DeleteKeyParams }>(
    "/api/keys/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await query<{ id: string }>(
        `DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id`,
        [request.params.id, request.user!.userId],
      );

      const row = result.rows[0];
      if (!row) {
        return reply.code(404).send({ error: "API key not found" });
      }

      return reply.code(204).send();
    },
  );
}

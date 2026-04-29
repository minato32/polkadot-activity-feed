import type { FastifyRequest, FastifyReply } from "fastify";
import { query } from "../services/database.js";

interface ApiKeyRow {
  id: string;
  user_id: string;
  tier: string;
  requests_today: number;
  requests_limit: number;
  last_reset_at: string;
}

declare module "fastify" {
  interface FastifyRequest {
    apiKeyUserId?: string;
    apiKeyTier?: string;
  }
}

/** Fastify preHandler: validates X-API-Key, enforces daily rate limit */
export async function requireApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = request.headers["x-api-key"];

  if (!apiKey || typeof apiKey !== "string") {
    return reply.code(401).send({ error: "Missing X-API-Key header" });
  }

  const result = await query<ApiKeyRow>(
    `SELECT id, user_id, tier, requests_today, requests_limit, last_reset_at
     FROM api_keys
     WHERE key = $1`,
    [apiKey],
  );

  const row = result.rows[0];
  if (!row) {
    return reply.code(401).send({ error: "Invalid API key" });
  }

  // Reset counter if it's a new calendar day
  const lastReset = new Date(row.last_reset_at);
  const now = new Date();
  const isNewDay =
    lastReset.getUTCFullYear() !== now.getUTCFullYear() ||
    lastReset.getUTCMonth() !== now.getUTCMonth() ||
    lastReset.getUTCDate() !== now.getUTCDate();

  if (isNewDay) {
    await query(
      `UPDATE api_keys SET requests_today = 0, last_reset_at = NOW() WHERE id = $1`,
      [row.id],
    );
    row.requests_today = 0;
  }

  if (row.requests_today >= row.requests_limit) {
    return reply.code(429).send({ error: "Daily rate limit exceeded" });
  }

  // Increment counter
  await query(
    `UPDATE api_keys SET requests_today = requests_today + 1 WHERE id = $1`,
    [row.id],
  );

  request.apiKeyUserId = row.user_id;
  request.apiKeyTier = row.tier;
}

import type { FastifyInstance } from "fastify";
import type { DigestConfig } from "@polkadot-feed/shared";
import { requireAuth } from "../middleware/auth.js";
import {
  getDigestConfig,
  upsertDigestConfig,
  getDigestHistory,
} from "../services/digest.js";

interface UpsertDigestBody {
  frequency: DigestConfig["frequency"];
  email?: string;
  telegramChatId?: string;
  enabled?: boolean;
}

export function registerDigestRoutes(app: FastifyInstance): void {
  /** GET /api/digests/config — get the user's digest config */
  app.get(
    "/api/digests/config",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const config = await getDigestConfig(request.user!.userId);
      if (!config) {
        return reply.code(404).send({ error: "No digest config found" });
      }
      return reply.send(config);
    },
  );

  /** POST /api/digests/config — create or update the user's digest config */
  app.post<{ Body: UpsertDigestBody }>(
    "/api/digests/config",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { frequency, email, telegramChatId, enabled } = request.body;

      if (!frequency || !["daily", "weekly"].includes(frequency)) {
        return reply.code(400).send({ error: "frequency must be 'daily' or 'weekly'" });
      }

      const config = await upsertDigestConfig(
        request.user!.userId,
        frequency,
        email,
        telegramChatId,
        enabled ?? true,
      );
      return reply.code(201).send(config);
    },
  );

  /** GET /api/digests/history — list past digests for the user */
  app.get(
    "/api/digests/history",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const history = await getDigestHistory(request.user!.userId);
      return reply.send(history);
    },
  );
}

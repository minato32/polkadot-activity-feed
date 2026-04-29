import type { FastifyInstance } from "fastify";
import { getCorrelation, getRecentCorrelations } from "../services/xcm-correlation.js";

interface CorrelationParams {
  id: string;
}

export function registerXcmRoutes(app: FastifyInstance): void {
  /** GET /api/xcm/correlations — list recent XCM correlations */
  app.get("/api/xcm/correlations", async (request, reply) => {
    const rawLimit = (request.query as Record<string, string>)["limit"];
    const limit = rawLimit ? Math.min(Number(rawLimit), 200) : 50;
    const correlations = await getRecentCorrelations(limit);
    return reply.send(correlations);
  });

  /** GET /api/xcm/correlations/:id — get a specific correlation */
  app.get<{ Params: CorrelationParams }>(
    "/api/xcm/correlations/:id",
    async (request, reply) => {
      const correlation = await getCorrelation(request.params.id);
      if (!correlation) {
        return reply.code(404).send({ error: "Correlation not found" });
      }
      return reply.send(correlation);
    },
  );
}

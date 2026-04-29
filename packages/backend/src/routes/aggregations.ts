import type { FastifyInstance } from "fastify";
import { getAggregation, getRecentAggregations } from "../services/aggregation.js";

interface AggregationParams {
  id: string;
}

export function registerAggregationRoutes(app: FastifyInstance): void {
  /** GET /api/aggregations — list recent event aggregations */
  app.get("/api/aggregations", async (request, reply) => {
    const rawLimit = (request.query as Record<string, string>)["limit"];
    const limit = rawLimit ? Math.min(Number(rawLimit), 100) : 20;
    const aggregations = await getRecentAggregations(limit);
    return reply.send(aggregations);
  });

  /** GET /api/aggregations/:id — get a specific aggregation */
  app.get<{ Params: AggregationParams }>(
    "/api/aggregations/:id",
    async (request, reply) => {
      const aggregation = await getAggregation(request.params.id);
      if (!aggregation) {
        return reply.code(404).send({ error: "Aggregation not found" });
      }
      return reply.send(aggregation);
    },
  );
}

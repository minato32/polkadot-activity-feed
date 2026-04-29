import type { FastifyInstance } from "fastify";
import { healthCheck as dbHealthCheck } from "../services/database.js";

export function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    const dbHealthy = await dbHealthCheck();

    return {
      status: dbHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? "up" : "down",
      },
    };
  });
}

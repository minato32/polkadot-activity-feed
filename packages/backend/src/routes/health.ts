import type { FastifyInstance } from "fastify";
import { healthCheck as dbHealthCheck } from "../services/database.js";
import { healthCheck as redisHealthCheck } from "../services/redis.js";

export function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    const [dbHealthy, redisHealthy] = await Promise.all([
      dbHealthCheck(),
      redisHealthCheck(),
    ]);

    const allHealthy = dbHealthy && redisHealthy;

    return {
      status: allHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? "up" : "down",
        redis: redisHealthy ? "up" : "down",
      },
    };
  });
}

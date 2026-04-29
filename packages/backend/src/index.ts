import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { registerHealthRoutes } from "./routes/health.js";
import { registerEventRoutes } from "./routes/events.js";
import {
  registerWebSocketRoutes,
  startWebSocketFanout,
  startHeartbeat,
} from "./routes/websocket.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerWalletRoutes } from "./routes/wallets.js";
import { registerPresetRoutes } from "./routes/presets.js";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { registerLabelRoutes } from "./routes/labels.js";
import { registerXcmRoutes } from "./routes/xcm.js";
import { registerAggregationRoutes } from "./routes/aggregations.js";
import { registerDigestRoutes } from "./routes/digests.js";
import { registerSearchRoutes } from "./routes/search.js";
import { registerExportRoutes } from "./routes/export.js";
import { registerApiKeyRoutes } from "./routes/api-keys.js";
import { registerDeveloperRoutes } from "./routes/developer.js";
import { connectAllChains, disconnectAllChains } from "./services/chain-connection.js";
import { startAllIngestion, stopAllIngestion } from "./services/ingestion.js";
import { closePool } from "./services/database.js";
import { closeRedis } from "./services/redis.js";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  });

  await app.register(websocket);

  // Register routes
  registerHealthRoutes(app);
  registerEventRoutes(app);
  registerWebSocketRoutes(app);
  registerAuthRoutes(app);
  registerWalletRoutes(app);
  registerPresetRoutes(app);
  registerNotificationRoutes(app);
  registerLabelRoutes(app);
  registerXcmRoutes(app);
  registerAggregationRoutes(app);
  registerDigestRoutes(app);
  registerSearchRoutes(app);
  registerExportRoutes(app);
  registerApiKeyRoutes(app);
  registerDeveloperRoutes(app);

  // Start server
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Backend running on ${HOST}:${PORT}`);

  // Connect to chains and start ingestion
  connectAllChains();
  await startAllIngestion();
  await startWebSocketFanout();
  const heartbeatInterval = startHeartbeat();

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info("Shutting down...");
    clearInterval(heartbeatInterval);
    stopAllIngestion();
    await disconnectAllChains();
    await closeRedis();
    await closePool();
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

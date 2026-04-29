import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import type { SubscribePayload, ChainId } from "@polkadot-feed/shared";
import { WS_HEARTBEAT_INTERVAL } from "@polkadot-feed/shared";
import { CHANNELS } from "../services/redis.js";
import { getSubscriber } from "../services/redis.js";

interface ClientState {
  ws: WebSocket;
  chains: Set<ChainId>;
  eventTypes: Set<string>;
  minSignificance: number;
  alive: boolean;
}

const clients = new Set<ClientState>();

export function registerWebSocketRoutes(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket) => {
    const state: ClientState = {
      ws: socket,
      chains: new Set(),
      eventTypes: new Set(),
      minSignificance: 0,
      alive: true,
    };

    clients.add(state);

    socket.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "subscribe") {
          const payload = msg.payload as SubscribePayload;
          if (payload.chains) {
            state.chains = new Set(payload.chains);
          }
          if (payload.eventTypes) {
            state.eventTypes = new Set(payload.eventTypes);
          }
          if (payload.minSignificance !== undefined) {
            state.minSignificance = payload.minSignificance;
          }
          socket.send(JSON.stringify({ type: "subscribed", payload }));
        }

        if (msg.type === "unsubscribe") {
          state.chains.clear();
          state.eventTypes.clear();
          state.minSignificance = 0;
          socket.send(JSON.stringify({ type: "unsubscribed" }));
        }

        if (msg.type === "pong") {
          state.alive = true;
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on("close", () => {
      clients.delete(state);
    });

    socket.on("error", () => {
      clients.delete(state);
    });
  });
}

/** Start Redis subscriber and fan out events to connected WebSocket clients */
export async function startWebSocketFanout(): Promise<void> {
  const sub = getSubscriber();

  await sub.subscribe(CHANNELS.all);

  sub.on("message", (_channel: string, message: string) => {
    for (const client of clients) {
      if (!client.alive || client.ws.readyState !== 1) {
        clients.delete(client);
        continue;
      }

      try {
        const event = JSON.parse(message);

        // Apply client filters
        if (client.chains.size > 0 && !client.chains.has(event.chainId)) {
          continue;
        }
        if (
          client.eventTypes.size > 0 &&
          !client.eventTypes.has(event.eventType)
        ) {
          continue;
        }
        if (event.significance < client.minSignificance) {
          continue;
        }

        client.ws.send(
          JSON.stringify({ type: "new_event", payload: event }),
        );
      } catch {
        // Skip this client on error
      }
    }
  });
}

/** Start heartbeat interval to detect dead connections */
export function startHeartbeat(): NodeJS.Timeout {
  return setInterval(() => {
    for (const client of clients) {
      if (!client.alive) {
        client.ws.terminate();
        clients.delete(client);
        continue;
      }
      client.alive = false;
      client.ws.send(JSON.stringify({ type: "ping" }));
    }
  }, WS_HEARTBEAT_INTERVAL);
}

/** Get count of connected WebSocket clients */
export function getClientCount(): number {
  return clients.size;
}

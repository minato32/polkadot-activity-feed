import type { FastifyInstance } from "fastify";
import type { EventFilter, PaginatedEvents } from "@polkadot-feed/shared";
import { DEFAULT_PAGE_SIZE } from "@polkadot-feed/shared";

export function registerEventRoutes(app: FastifyInstance) {
  app.get<{ Querystring: EventFilter }>("/api/events", async (request) => {
    const { limit = DEFAULT_PAGE_SIZE, cursor, chains, eventTypes } = request.query;

    // TODO: Replace with actual DB query
    const result: PaginatedEvents = {
      events: [],
      nextCursor: null,
      hasMore: false,
    };

    app.log.info({ chains, eventTypes, limit, cursor }, "Fetching events");
    return result;
  });
}

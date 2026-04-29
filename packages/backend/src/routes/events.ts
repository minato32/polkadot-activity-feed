import type { FastifyInstance } from "fastify";
import type {
  PaginatedResponse,
  ChainEvent,
  EventRow,
} from "@polkadot-feed/shared";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@polkadot-feed/shared";
import { query } from "../services/database.js";
import { rowToEvent } from "../services/event-store.js";

interface EventsQuerystring {
  chains?: string;
  eventTypes?: string;
  minSignificance?: string;
  limit?: string;
  cursor?: string;
}

export function registerEventRoutes(app: FastifyInstance) {
  app.get<{ Querystring: EventsQuerystring }>(
    "/api/events",
    async (request) => {
      const {
        chains,
        eventTypes,
        minSignificance,
        limit: limitStr,
        cursor,
      } = request.query;

      const limit = Math.min(
        Math.max(Number(limitStr) || DEFAULT_PAGE_SIZE, 1),
        MAX_PAGE_SIZE,
      );

      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      // Chain filter
      if (chains) {
        const chainList = chains.split(",").filter(Boolean);
        if (chainList.length > 0) {
          conditions.push(`chain_id = ANY($${paramIdx})`);
          params.push(chainList);
          paramIdx++;
        }
      }

      // Event type filter
      if (eventTypes) {
        const typeList = eventTypes.split(",").filter(Boolean);
        if (typeList.length > 0) {
          conditions.push(`event_type = ANY($${paramIdx})`);
          params.push(typeList);
          paramIdx++;
        }
      }

      // Significance filter
      if (minSignificance !== undefined) {
        const sig = Number(minSignificance);
        if (sig >= 0 && sig <= 2) {
          conditions.push(`significance >= $${paramIdx}`);
          params.push(sig);
          paramIdx++;
        }
      }

      // Cursor-based pagination (cursor = timestamp of last item)
      if (cursor) {
        conditions.push(`timestamp < $${paramIdx}`);
        params.push(cursor);
        paramIdx++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Fetch one extra row to determine hasMore
      params.push(limit + 1);
      const sql = `
        SELECT * FROM events
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIdx}
      `;

      const result = await query<EventRow>(sql, params);
      const hasMore = result.rows.length > limit;
      const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
      const events = rows.map(rowToEvent);

      const nextCursor =
        hasMore && events.length > 0
          ? events[events.length - 1]!.timestamp
          : null;

      const response: PaginatedResponse<ChainEvent> = {
        items: events,
        nextCursor,
        hasMore,
      };

      return response;
    },
  );
}

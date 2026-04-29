import type { FastifyInstance } from "fastify";
import type { PaginatedResponse, ChainEvent, EventRow } from "@polkadot-feed/shared";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@polkadot-feed/shared";
import { query } from "../services/database.js";
import { rowToEvent } from "../services/event-store.js";

interface SearchQuerystring {
  q?: string;
  chains?: string;
  eventTypes?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  limit?: string;
  cursor?: string;
}

export function registerSearchRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: SearchQuerystring }>(
    "/api/search",
    async (request, reply) => {
      const {
        q,
        chains,
        eventTypes,
        dateFrom,
        dateTo,
        amountMin,
        amountMax,
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

      // Full-text search via GIN index
      if (q && q.trim().length > 0) {
        const tsQuery = q
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .join(" & ");
        conditions.push(
          `to_tsvector('english', coalesce(pallet,'') || ' ' || coalesce(method,'') || ' ' || coalesce(event_type,'')) @@ to_tsquery('english', $${paramIdx})`,
        );
        params.push(tsQuery);
        paramIdx++;
      }

      // Address search using accounts array containment
      if (q && q.trim().startsWith("1") || q?.trim().startsWith("5")) {
        // Looks like an SS58 address — search accounts array
        conditions.push(`accounts @> $${paramIdx}`);
        params.push([q!.trim()]);
        paramIdx++;
      }

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

      // Date range filters
      if (dateFrom) {
        conditions.push(`timestamp >= $${paramIdx}`);
        params.push(dateFrom);
        paramIdx++;
      }

      if (dateTo) {
        conditions.push(`timestamp <= $${paramIdx}`);
        params.push(dateTo);
        paramIdx++;
      }

      // Amount range (stored in data->>'amount' as bigint string)
      if (amountMin !== undefined) {
        const min = Number(amountMin);
        if (!isNaN(min)) {
          conditions.push(`(data->>'amount')::NUMERIC >= $${paramIdx}`);
          params.push(min);
          paramIdx++;
        }
      }

      if (amountMax !== undefined) {
        const max = Number(amountMax);
        if (!isNaN(max)) {
          conditions.push(`(data->>'amount')::NUMERIC <= $${paramIdx}`);
          params.push(max);
          paramIdx++;
        }
      }

      // Cursor-based pagination
      if (cursor) {
        conditions.push(`timestamp < $${paramIdx}`);
        params.push(cursor);
        paramIdx++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      params.push(limit + 1);
      const sql = `
        SELECT * FROM events
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIdx}
      `;

      let result = await query<EventRow>(sql, params);

      // Fallback to LIKE search on event_type/pallet/method if FTS returns nothing
      if (result.rows.length === 0 && q && q.trim().length > 0) {
        const likeParams: unknown[] = [];
        let likeParamIdx = 1;
        const likeConditions: string[] = [];
        const searchTerm = `%${q.trim()}%`;

        likeConditions.push(
          `(event_type ILIKE $${likeParamIdx} OR pallet ILIKE $${likeParamIdx} OR method ILIKE $${likeParamIdx})`,
        );
        likeParams.push(searchTerm);
        likeParamIdx++;

        // Re-apply non-FTS conditions
        if (chains) {
          const chainList = chains.split(",").filter(Boolean);
          if (chainList.length > 0) {
            likeConditions.push(`chain_id = ANY($${likeParamIdx})`);
            likeParams.push(chainList);
            likeParamIdx++;
          }
        }
        if (dateFrom) {
          likeConditions.push(`timestamp >= $${likeParamIdx}`);
          likeParams.push(dateFrom);
          likeParamIdx++;
        }
        if (dateTo) {
          likeConditions.push(`timestamp <= $${likeParamIdx}`);
          likeParams.push(dateTo);
          likeParamIdx++;
        }
        if (cursor) {
          likeConditions.push(`timestamp < $${likeParamIdx}`);
          likeParams.push(cursor);
          likeParamIdx++;
        }

        likeParams.push(limit + 1);
        const likeSql = `
          SELECT * FROM events
          WHERE ${likeConditions.join(" AND ")}
          ORDER BY timestamp DESC
          LIMIT $${likeParamIdx}
        `;

        result = await query<EventRow>(likeSql, likeParams);
      }

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

      return reply.send(response);
    },
  );
}

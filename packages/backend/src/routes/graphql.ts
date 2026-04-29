import type { FastifyInstance } from "fastify";
import type { ChainEvent, EventRow } from "@polkadot-feed/shared";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@polkadot-feed/shared";
import { ALL_CHAINS } from "@polkadot-feed/shared";
import { query } from "../services/database.js";
import { rowToEvent } from "../services/event-store.js";
import { getAllLabels } from "../services/labels.js";
import { getRecentCorrelations } from "../services/xcm-correlation.js";
import { getRecentAggregations } from "../services/aggregation.js";
import { requireApiKey } from "../middleware/api-key.js";

interface GraphQLBody {
  query?: string;
  variables?: Record<string, unknown>;
}

/** Known top-level operation names this stub supports */
type OperationName =
  | "events"
  | "event"
  | "chains"
  | "labels"
  | "xcmCorrelations"
  | "aggregations";

/** Extract the first operation name from a query string */
function parseOperationName(queryStr: string): OperationName | null {
  // Match patterns like: { events(...) { ... } } or query { events { ... } }
  const match = queryStr.match(
    /\{\s*(events|event|chains|labels|xcmCorrelations|aggregations)/,
  );
  return match ? (match[1] as OperationName) : null;
}

/** Extract a named argument value from a GraphQL query fragment */
function extractArg(queryStr: string, argName: string): string | null {
  const re = new RegExp(`${argName}\\s*:\\s*"([^"]*)"`, "i");
  const match = queryStr.match(re);
  return match ? match[1]! : null;
}

function extractIntArg(queryStr: string, argName: string): number | null {
  const re = new RegExp(`${argName}\\s*:\\s*(\\d+)`, "i");
  const match = queryStr.match(re);
  return match ? parseInt(match[1]!, 10) : null;
}

async function resolveEvents(
  queryStr: string,
  variables: Record<string, unknown>,
): Promise<{ items: ChainEvent[]; nextCursor: string | null; hasMore: boolean }> {
  const chains =
    (variables["chains"] as string[] | undefined) ??
    (extractArg(queryStr, "chains") ? [extractArg(queryStr, "chains")!] : undefined);

  const eventTypes =
    (variables["eventTypes"] as string[] | undefined) ??
    (extractArg(queryStr, "eventTypes") ? [extractArg(queryStr, "eventTypes")!] : undefined);

  const cursor =
    (variables["cursor"] as string | undefined) ?? extractArg(queryStr, "cursor") ?? undefined;

  const rawLimit =
    (variables["limit"] as number | undefined) ?? extractIntArg(queryStr, "limit") ?? DEFAULT_PAGE_SIZE;

  const limit = Math.min(Math.max(rawLimit, 1), MAX_PAGE_SIZE);

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (chains && chains.length > 0) {
    conditions.push(`chain_id = ANY($${paramIdx})`);
    params.push(chains);
    paramIdx++;
  }

  if (eventTypes && eventTypes.length > 0) {
    conditions.push(`event_type = ANY($${paramIdx})`);
    params.push(eventTypes);
    paramIdx++;
  }

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

  const result = await query<EventRow>(sql, params);
  const hasMore = result.rows.length > limit;
  const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
  const items = rows.map(rowToEvent);

  const nextCursor =
    hasMore && items.length > 0 ? items[items.length - 1]!.timestamp : null;

  return { items, nextCursor, hasMore };
}

async function resolveEvent(
  queryStr: string,
  variables: Record<string, unknown>,
): Promise<ChainEvent | null> {
  const id =
    (variables["id"] as string | undefined) ?? extractArg(queryStr, "id");

  if (!id) return null;

  const result = await query<EventRow>(
    `SELECT * FROM events WHERE id = $1`,
    [id],
  );

  const row = result.rows[0];
  return row ? rowToEvent(row) : null;
}

export function registerGraphQLRoutes(app: FastifyInstance): void {
  /**
   * POST /api/graphql
   * Accepts { query, variables } body.
   * Supports: events, event, chains, labels, xcmCorrelations, aggregations.
   * Authenticates via X-API-Key header.
   */
  app.post<{ Body: GraphQLBody }>(
    "/api/graphql",
    { preHandler: [requireApiKey] },
    async (request, reply) => {
      const { query: queryStr, variables = {} } = request.body ?? {};

      if (!queryStr || typeof queryStr !== "string") {
        return reply
          .code(400)
          .send({ errors: [{ message: "query string is required" }] });
      }

      const operation = parseOperationName(queryStr);

      if (!operation) {
        return reply.code(400).send({
          errors: [
            {
              message:
                "Unknown operation. Supported: events, event, chains, labels, xcmCorrelations, aggregations",
            },
          ],
        });
      }

      try {
        switch (operation) {
          case "events": {
            const data = await resolveEvents(queryStr, variables);
            return reply.send({ data: { events: data } });
          }

          case "event": {
            const event = await resolveEvent(queryStr, variables);
            return reply.send({ data: { event } });
          }

          case "chains": {
            return reply.send({ data: { chains: ALL_CHAINS } });
          }

          case "labels": {
            const labels = await getAllLabels();
            return reply.send({ data: { labels } });
          }

          case "xcmCorrelations": {
            const rawLimit = extractIntArg(queryStr, "limit");
            const limit = rawLimit ? Math.min(rawLimit, 200) : 50;
            const correlations = await getRecentCorrelations(limit);
            return reply.send({ data: { xcmCorrelations: correlations } });
          }

          case "aggregations": {
            const rawLimit = extractIntArg(queryStr, "limit");
            const limit = rawLimit ? Math.min(rawLimit, 100) : 20;
            const aggregations = await getRecentAggregations(limit);
            return reply.send({ data: { aggregations } });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.code(500).send({ errors: [{ message }] });
      }
    },
  );

  /**
   * GET /api/graphql/schema — returns a human-readable schema description
   */
  app.get("/api/graphql/schema", async (_request, reply) => {
    const schema = `
# Polkadot Activity Feed — GraphQL API (MVP stub)
# Authenticate with X-API-Key header.

type Query {
  events(chains: [String], eventTypes: [String], limit: Int, cursor: String): EventsPage
  event(id: String): Event
  chains: [Chain]
  labels: [Label]
  xcmCorrelations(limit: Int): [XcmCorrelation]
  aggregations(limit: Int): [EventAggregation]
}

type EventsPage {
  items: [Event]
  nextCursor: String
  hasMore: Boolean
}
`.trim();

    return reply.header("Content-Type", "text/plain").send(schema);
  });
}

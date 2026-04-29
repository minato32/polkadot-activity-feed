import type { FastifyInstance } from "fastify";
import type { EventRow } from "@polkadot-feed/shared";
import { requireAuth } from "../middleware/auth.js";
import { query } from "../services/database.js";

interface ExportQuerystring {
  chains?: string;
  eventTypes?: string;
  dateFrom?: string;
  dateTo?: string;
  format?: string;
}

/** Maximum history window in days per tier */
const TIER_DAY_LIMITS: Record<string, number | null> = {
  free: 7,
  pro: 90,
  whale: null,
  enterprise: null,
};

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsvLine(row: EventRow): string {
  const fields = [
    row.timestamp,
    row.chain_id,
    row.event_type,
    row.pallet,
    row.method,
    (row.accounts ?? []).join("|"),
    String(row.significance),
    row.block_number,
  ];
  return fields.map((f) => escapeCsvField(String(f ?? ""))).join(",");
}

export function registerExportRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: ExportQuerystring }>(
    "/api/export",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { chains, eventTypes, dateFrom, dateTo, format } = request.query;

      if (format && format !== "csv") {
        return reply.code(400).send({ error: "Only format=csv is supported" });
      }

      const tier = request.user!.tier;
      const dayLimit = TIER_DAY_LIMITS[tier] ?? 7;

      // Enforce date range window
      const now = new Date();
      let effectiveDateFrom = dateFrom;
      let effectiveDateTo = dateTo ?? now.toISOString();

      if (dayLimit !== null) {
        const earliestAllowed = new Date(now);
        earliestAllowed.setDate(earliestAllowed.getDate() - dayLimit);

        if (!effectiveDateFrom) {
          effectiveDateFrom = earliestAllowed.toISOString();
        } else {
          const requested = new Date(effectiveDateFrom);
          if (requested < earliestAllowed) {
            effectiveDateFrom = earliestAllowed.toISOString();
          }
        }
      }

      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (chains) {
        const chainList = chains.split(",").filter(Boolean);
        if (chainList.length > 0) {
          conditions.push(`chain_id = ANY($${paramIdx})`);
          params.push(chainList);
          paramIdx++;
        }
      }

      if (eventTypes) {
        const typeList = eventTypes.split(",").filter(Boolean);
        if (typeList.length > 0) {
          conditions.push(`event_type = ANY($${paramIdx})`);
          params.push(typeList);
          paramIdx++;
        }
      }

      if (effectiveDateFrom) {
        conditions.push(`timestamp >= $${paramIdx}`);
        params.push(effectiveDateFrom);
        paramIdx++;
      }

      if (effectiveDateTo) {
        conditions.push(`timestamp <= $${paramIdx}`);
        params.push(effectiveDateTo);
        paramIdx++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const sql = `
        SELECT id, chain_id, block_number, timestamp, event_type, pallet, method,
               accounts, data, significance, created_at
        FROM events
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT 100000
      `;

      const result = await query<EventRow>(sql, params);

      const csvHeader = "timestamp,chain,event_type,pallet,method,accounts,significance,block_number\n";
      const csvBody = result.rows.map(rowToCsvLine).join("\n");
      const csv = csvHeader + csvBody;

      return reply
        .header("Content-Type", "text/csv")
        .header("Content-Disposition", `attachment; filename="events-export.csv"`)
        .send(csv);
    },
  );
}

import type { FastifyInstance } from "fastify";
import type { LabelCategory } from "@polkadot-feed/shared";
import { requireAuth } from "../middleware/auth.js";
import {
  getAllLabels,
  getLabel,
  submitLabel,
} from "../services/labels.js";

interface AddressParams {
  address: string;
}

interface SubmitLabelBody {
  address: string;
  label: string;
  category: LabelCategory;
}

export function registerLabelRoutes(app: FastifyInstance): void {
  /** GET /api/labels — list all verified labels */
  app.get("/api/labels", async (_request, reply) => {
    const labels = await getAllLabels();
    return reply.send(labels);
  });

  /** GET /api/labels/:address — get label for a specific address */
  app.get<{ Params: AddressParams }>(
    "/api/labels/:address",
    async (request, reply) => {
      const labelEntry = await getLabel(request.params.address);
      if (!labelEntry) {
        return reply.code(404).send({ error: "No label found for address" });
      }
      return reply.send(labelEntry);
    },
  );

  /** POST /api/labels — submit a community label (requires auth) */
  app.post<{ Body: SubmitLabelBody }>(
    "/api/labels",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { address, label, category } = request.body;

      if (!address || !label || !category) {
        return reply.code(400).send({ error: "address, label, and category are required" });
      }

      const validCategories: LabelCategory[] = [
        "exchange", "treasury", "validator", "fund", "bridge", "team",
      ];
      if (!validCategories.includes(category)) {
        return reply.code(400).send({ error: `category must be one of: ${validCategories.join(", ")}` });
      }

      const result = await submitLabel(address, label, category);
      return reply.code(201).send(result);
    },
  );
}

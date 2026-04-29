import type { FastifyInstance } from "fastify";
import type { User } from "@polkadot-feed/shared";
import { query } from "../services/database.js";
import {
  generateChallenge,
  verifySignature,
  generateToken,
} from "../services/auth.js";
import { requireAuth } from "../middleware/auth.js";

interface ChallengeBody {
  address: string;
}

interface VerifyBody {
  address: string;
  signature: string;
  message: string;
}

export function registerAuthRoutes(app: FastifyInstance): void {
  /** POST /api/auth/challenge — returns a nonce message for the wallet to sign */
  app.post<{ Body: ChallengeBody }>(
    "/api/auth/challenge",
    async (request, reply) => {
      const { address } = request.body;

      if (!address || typeof address !== "string") {
        return reply.code(400).send({ error: "address is required" });
      }

      const message = generateChallenge(address);
      return reply.send({ message });
    },
  );

  /** POST /api/auth/verify — verifies signature, upserts user, returns JWT */
  app.post<{ Body: VerifyBody }>(
    "/api/auth/verify",
    async (request, reply) => {
      const { address, signature, message } = request.body;

      if (!address || !signature || !message) {
        return reply.code(400).send({ error: "address, signature, and message are required" });
      }

      const valid = verifySignature(address, signature, message);
      if (!valid) {
        return reply.code(401).send({ error: "Signature verification failed" });
      }

      const result = await query<{
        id: string;
        address: string;
        display_name: string | null;
        tier: string;
        created_at: string;
      }>(
        `INSERT INTO users (address)
         VALUES ($1)
         ON CONFLICT (address) DO UPDATE SET address = EXCLUDED.address
         RETURNING id, address, display_name, tier, created_at`,
        [address],
      );

      const row = result.rows[0];
      if (!row) {
        return reply.code(500).send({ error: "Failed to upsert user" });
      }

      const user: User = {
        id: row.id,
        address: row.address,
        displayName: row.display_name,
        tier: row.tier as User["tier"],
        createdAt: row.created_at,
      };

      const token = generateToken(user);
      return reply.send({ token, user });
    },
  );

  /** GET /api/auth/me — returns authenticated user profile */
  app.get(
    "/api/auth/me",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await query<{
        id: string;
        address: string;
        display_name: string | null;
        tier: string;
        created_at: string;
      }>(
        "SELECT id, address, display_name, tier, created_at FROM users WHERE id = $1",
        [request.user!.userId],
      );

      const row = result.rows[0];
      if (!row) {
        return reply.code(404).send({ error: "User not found" });
      }

      const user: User = {
        id: row.id,
        address: row.address,
        displayName: row.display_name,
        tier: row.tier as User["tier"],
        createdAt: row.created_at,
      };

      return reply.send(user);
    },
  );
}

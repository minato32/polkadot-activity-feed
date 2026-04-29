import type { FastifyInstance } from "fastify";
import type { FollowedWallet, UserTier, TierLimits, ChainId } from "@polkadot-feed/shared";
import { query } from "../services/database.js";
import { requireAuth } from "../middleware/auth.js";

const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: { wallets: 5, presets: 3 },
  pro: { wallets: 100, presets: null },
  whale: { wallets: null, presets: null },
  enterprise: { wallets: null, presets: null },
};

interface WalletRow {
  id: string;
  user_id: string;
  address: string;
  label: string | null;
  chain_id: string | null;
  created_at: string;
}

interface FollowBody {
  address: string;
  label?: string;
  chainId?: string;
}

interface WalletParams {
  id: string;
}

function rowToWallet(row: WalletRow): FollowedWallet {
  return {
    id: row.id,
    userId: row.user_id,
    address: row.address,
    label: row.label,
    chainId: (row.chain_id as ChainId) ?? null,
    createdAt: row.created_at,
  };
}

export function registerWalletRoutes(app: FastifyInstance): void {
  /** GET /api/wallets — list user's followed wallets */
  app.get(
    "/api/wallets",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await query<WalletRow>(
        "SELECT id, user_id, address, label, chain_id, created_at FROM followed_wallets WHERE user_id = $1 ORDER BY created_at DESC",
        [request.user!.userId],
      );
      return reply.send(result.rows.map(rowToWallet));
    },
  );

  /** POST /api/wallets — follow a wallet */
  app.post<{ Body: FollowBody }>(
    "/api/wallets",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { address, label, chainId } = request.body;

      if (!address || typeof address !== "string") {
        return reply.code(400).send({ error: "address is required" });
      }

      const tier = request.user!.tier as UserTier;
      const limit = TIER_LIMITS[tier].wallets;

      if (limit !== null) {
        const countResult = await query<{ count: string }>(
          "SELECT COUNT(*) AS count FROM followed_wallets WHERE user_id = $1",
          [request.user!.userId],
        );
        const count = Number(countResult.rows[0]?.count ?? 0);
        if (count >= limit) {
          return reply.code(403).send({
            error: `Tier limit reached. ${tier} accounts may follow up to ${limit} wallets.`,
          });
        }
      }

      const result = await query<WalletRow>(
        `INSERT INTO followed_wallets (user_id, address, label, chain_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, address, label, chain_id, created_at`,
        [request.user!.userId, address, label ?? null, chainId ?? null],
      );

      const row = result.rows[0];
      if (!row) return reply.code(500).send({ error: "Insert failed" });

      return reply.code(201).send(rowToWallet(row));
    },
  );

  /** DELETE /api/wallets/:id — unfollow a wallet */
  app.delete<{ Params: WalletParams }>(
    "/api/wallets/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const result = await query<WalletRow>(
        "DELETE FROM followed_wallets WHERE id = $1 AND user_id = $2 RETURNING id",
        [request.params.id, request.user!.userId],
      );

      if (result.rowCount === 0) {
        return reply.code(404).send({ error: "Wallet not found or not owned by user" });
      }

      return reply.code(204).send();
    },
  );
}

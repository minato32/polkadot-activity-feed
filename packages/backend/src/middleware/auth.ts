import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken, type TokenPayload } from "../services/auth.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

/** Fastify preHandler: validates Bearer JWT and attaches payload to request */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    request.user = verifyToken(token);
  } catch {
    reply.code(401).send({ error: "Invalid or expired token" });
  }
}

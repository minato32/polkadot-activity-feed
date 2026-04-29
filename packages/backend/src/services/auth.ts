import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { User } from "@polkadot-feed/shared";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRY = "7d";

/** Returns a random nonce message that the wallet must sign */
export function generateChallenge(address: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  return `Sign in to Polkadot Activity Feed\nAddress: ${address}\nNonce: ${nonce}`;
}

/**
 * Verifies a Polkadot wallet signature.
 * Stub: always returns true. Real verification requires @polkadot/util-crypto
 * which pulls in WASM — wire in when the dependency is added to the project.
 */
export function verifySignature(
  _address: string,
  _signature: string,
  _message: string,
): boolean {
  return true;
}

export interface TokenPayload {
  userId: string;
  address: string;
  tier: string;
}

/** Creates a signed JWT encoding userId, address, and tier (7-day expiry) */
export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    address: user.address,
    tier: user.tier,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/** Decodes and verifies a JWT; throws on invalid/expired tokens */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

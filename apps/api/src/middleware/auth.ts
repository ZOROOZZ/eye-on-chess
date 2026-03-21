import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, AccessTokenPayload } from "../lib/jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    user: AccessTokenPayload;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing or invalid token" });
  }

  try {
    const token = header.slice(7);
    request.user = verifyAccessToken(token);
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}

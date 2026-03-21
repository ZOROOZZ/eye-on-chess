import jwt, { type Secret } from "jsonwebtoken";
import crypto from "crypto";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET: Secret = process.env.JWT_SECRET;

export interface AccessTokenPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign({ ...payload }, JWT_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as unknown as AccessTokenPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { SessionUser } from "@/types";

const SECRET = process.env.JWT_SECRET ?? "memoirs-2026-dev-secret-change-me";
export const COOKIE_NAME = "yk_token";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, fullName: user.fullName },
    SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    if (
      typeof payload.id !== "number" ||
      typeof payload.username !== "string" ||
      typeof payload.fullName !== "string"
    ) {
      return null;
    }
    return {
      id: payload.id,
      username: payload.username,
      fullName: payload.fullName,
    };
  } catch {
    return null;
  }
}

/** Reads and verifies the session JWT from a request's cookies. */
export function getSessionUser(request: Request): SessionUser | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const token = match.slice(COOKIE_NAME.length + 1);
  return verifyToken(token);
}

export function sessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

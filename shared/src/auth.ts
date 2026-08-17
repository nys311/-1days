import jwt from "jsonwebtoken";

export interface AppTokenPayload {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

const DEFAULT_EXPIRY = "30d";

/** Signs the app session JWT. Only the `auth` service calls this. */
export function signAppToken(payload: AppTokenPayload, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: DEFAULT_EXPIRY });
}

/** Stateless verification — any service (e.g. `gateway`) can call this with just the shared secret, no DB round-trip. */
export function verifyAppToken(token: string, secret: string): AppTokenPayload {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string") throw new Error("Malformed token");
  const { userId, email, displayName, avatarUrl } = decoded as Record<string, unknown>;
  if (typeof userId !== "string" || typeof email !== "string" || typeof displayName !== "string") {
    throw new Error("Malformed token payload");
  }
  return { userId, email, displayName, avatarUrl: typeof avatarUrl === "string" ? avatarUrl : null };
}

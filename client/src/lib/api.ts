import { AUTH_URL } from "./config";

// Mirrors the `auth` service's response shape. Kept local (not in @minus1days/shared)
// since it isn't part of the gateway/engine contract in shared/src/http.ts — the auth
// service is the one thing the client talks to outside the gateway.
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request thất bại (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      /* ignore parse error, use default message */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** Exchanges a Google Identity Services ID token for an app session token. */
export function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  return postJson<AuthResponse>(`${AUTH_URL}/auth/google`, { idToken });
}

/** Dev-only: mint a session for a free-typed display name, no OAuth involved. */
export function loginDev(displayName: string): Promise<AuthResponse> {
  return postJson<AuthResponse>(`${AUTH_URL}/auth/dev-login`, { displayName });
}

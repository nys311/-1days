// Central place for runtime config pulled from Vite env vars. Keep every other
// module importing these constants instead of touching `import.meta.env` directly.

export const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:4000";
export const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4001";
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Dev quick-login (display-name only, no OAuth) is always available in `vite dev`
// (import.meta.env.DEV) and otherwise gated behind an explicit flag so it can be
// turned on for a staging deploy without shipping it to a real production build.
export const ALLOW_DEV_LOGIN = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEV_LOGIN === "true";

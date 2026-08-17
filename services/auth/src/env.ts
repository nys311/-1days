function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 4001),
  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID", "dev-placeholder-client-id"),
  JWT_SECRET: required("JWT_SECRET", "dev-insecure-secret-change-me"),
};

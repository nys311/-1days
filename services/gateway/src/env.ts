export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  SELF_URL: process.env.SELF_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  ENGINE_URL: process.env.ENGINE_URL ?? "http://localhost:4002",
  MATCHMAKING_URL: process.env.MATCHMAKING_URL ?? "http://localhost:4003",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
};

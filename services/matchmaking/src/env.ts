export const env = {
  PORT: Number(process.env.PORT ?? 4003),
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  SELF_URL: process.env.SELF_URL ?? `http://localhost:${process.env.PORT ?? 4003}`,
  ENGINE_URL: process.env.ENGINE_URL ?? "http://localhost:4002",
  GATEWAY_URL: process.env.GATEWAY_URL ?? "http://localhost:4000",
  BOTS_URL: process.env.BOTS_URL ?? "http://localhost:4004",
};

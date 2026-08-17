export const env = {
  PORT: Number(process.env.PORT ?? 4002),
  REACTION_WINDOW_MS: Number(process.env.REACTION_WINDOW_MS ?? 10_000),
};

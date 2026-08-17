import { PrismaClient } from "@prisma/client";

let client: PrismaClient | null = null;

/** Lazy singleton so services that never touch the DB (engine/gateway/bots) don't pay for a connection. */
export function getPrisma(): PrismaClient {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}

export * from "@prisma/client";

/**
 * Prisma Client Singleton
 *
 * This module provides a singleton instance of Prisma Client to prevent
 * multiple instances in development (which can exhaust database connections).
 *
 * @see https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

/**
 * Global type declaration for Prisma Client in development
 * Prevents TypeScript errors when using globalThis
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma Client instance
 * In development, use global instance to prevent hot-reload from creating new connections
 * In production, create a new instance
 */
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

/**
 * Store Prisma Client in global scope in development
 * This prevents creating multiple instances during hot-reload
 */
if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

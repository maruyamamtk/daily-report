/**
 * Environment Variable Management with Type Safety and Validation
 *
 * This module validates all required environment variables at startup using Zod.
 * It ensures type safety and provides helpful error messages for missing or invalid variables.
 *
 * Inspired by T3 Stack: https://create.t3.gg/en/usage/env-variables
 */

import { z } from "zod";

/**
 * Server-side environment variable schema
 * These variables are only accessible on the server side
 */
const serverSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid URL")
    .regex(
      /^postgresql:\/\/.+/,
      "DATABASE_URL must be a PostgreSQL connection string"
    ),

  // NextAuth
  NEXTAUTH_URL: z
    .string()
    .url("NEXTAUTH_URL must be a valid URL")
    .describe("Base URL for authentication callbacks"),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters for security")
    .describe("Secret for signing JWT tokens"),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development")
    .describe("Current Node.js environment"),
});

/**
 * Client-side environment variable schema
 * These variables are accessible on both client and server
 * They must be prefixed with NEXT_PUBLIC_
 */
const clientSchema = z.object({
  // Add client-side env vars here when needed
  // Example: NEXT_PUBLIC_API_URL: z.string().url()
});

/**
 * Validate environment variables
 * This function is called at module load time to ensure all required variables are present
 */
const validateEnv = () => {
  // Validate server-side variables
  const serverEnv = serverSchema.safeParse(process.env);

  if (!serverEnv.success) {
    console.error("❌ Invalid server environment variables:");
    console.error(JSON.stringify(serverEnv.error.format(), null, 2));
    throw new Error("Invalid server environment variables");
  }

  // Validate client-side variables
  const clientEnv = clientSchema.safeParse(process.env);

  if (!clientEnv.success) {
    console.error("❌ Invalid client environment variables:");
    console.error(JSON.stringify(clientEnv.error.format(), null, 2));
    throw new Error("Invalid client environment variables");
  }

  return {
    server: serverEnv.data,
    client: clientEnv.data,
  };
};

/**
 * Validated environment variables
 * Type-safe access to all environment variables
 */
const envVars = validateEnv();

/**
 * Type-safe environment variable object
 * Use this throughout the application instead of process.env
 *
 * @example
 * import { env } from '@/lib/env';
 *
 * // Server-side only
 * const dbUrl = env.DATABASE_URL;
 * const authSecret = env.NEXTAUTH_SECRET;
 *
 * // Client-side safe (add NEXT_PUBLIC_ vars to clientSchema first)
 * // const apiUrl = env.NEXT_PUBLIC_API_URL;
 */
export const env = {
  ...envVars.server,
  ...envVars.client,
};

/**
 * Export types for use in other modules
 */
export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
export type Env = ServerEnv & ClientEnv;

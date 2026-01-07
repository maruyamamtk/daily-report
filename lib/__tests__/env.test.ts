/**
 * Environment Variable Validation Tests
 *
 * These tests verify that the environment variable validation
 * works correctly for various scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateEnv } from "../env";

describe("Environment Variable Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to ensure fresh validation
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should validate correct environment variables", () => {
    const testEnv = {
      DATABASE_URL: "postgresql://user:password@localhost:5432/testdb",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "a".repeat(32), // 32 characters
      NODE_ENV: "development",
    };

    // Should not throw
    expect(() => validateEnv(testEnv)).not.toThrow();
  });

  it("should reject invalid DATABASE_URL", () => {
    const testEnv = {
      DATABASE_URL: "not-a-valid-url",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "a".repeat(32),
      NODE_ENV: "development",
    };

    // Should throw validation error
    expect(() => validateEnv(testEnv)).toThrow("Invalid server environment variables");
  });

  it("should reject non-PostgreSQL DATABASE_URL", () => {
    const testEnv = {
      DATABASE_URL: "mysql://user:password@localhost:3306/testdb",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "a".repeat(32),
      NODE_ENV: "development",
    };

    // Should throw validation error
    expect(() => validateEnv(testEnv)).toThrow("Invalid server environment variables");
  });

  it("should reject short NEXTAUTH_SECRET", () => {
    const testEnv = {
      DATABASE_URL: "postgresql://user:password@localhost:5432/testdb",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "too-short", // Less than 32 characters
      NODE_ENV: "development",
    };

    // Should throw validation error
    expect(() => validateEnv(testEnv)).toThrow("Invalid server environment variables");
  });

  it("should reject invalid NEXTAUTH_URL", () => {
    const testEnv = {
      DATABASE_URL: "postgresql://user:password@localhost:5432/testdb",
      NEXTAUTH_URL: "not-a-url",
      NEXTAUTH_SECRET: "a".repeat(32),
      NODE_ENV: "development",
    };

    // Should throw validation error
    expect(() => validateEnv(testEnv)).toThrow("Invalid server environment variables");
  });

  it("should reject invalid NODE_ENV", () => {
    const testEnv = {
      DATABASE_URL: "postgresql://user:password@localhost:5432/testdb",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "a".repeat(32),
      NODE_ENV: "invalid", // Not in enum
    };

    // Should throw validation error
    expect(() => validateEnv(testEnv)).toThrow("Invalid server environment variables");
  });

  it("should use default NODE_ENV if not provided", () => {
    const testEnv = {
      DATABASE_URL: "postgresql://user:password@localhost:5432/testdb",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "a".repeat(32),
      // NODE_ENV not provided - should use default 'development'
    };

    // Should not throw and use default 'development'
    const result = validateEnv(testEnv);
    expect(result.server.NODE_ENV).toBe("development");
  });

  it("should reject missing required variables", () => {
    const testEnv = {}; // Clear all env vars

    // Should throw validation error
    expect(() => validateEnv(testEnv)).toThrow("Invalid server environment variables");
  });
});

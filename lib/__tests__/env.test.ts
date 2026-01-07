/**
 * Environment Variable Validation Tests
 *
 * These tests verify that the environment variable validation
 * works correctly for various scenarios.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Environment Variable Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to ensure fresh validation
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should validate correct environment variables", () => {
    process.env.DATABASE_URL =
      "postgresql://user:password@localhost:5432/testdb";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.NEXTAUTH_SECRET = "a".repeat(32); // 32 characters
    process.env.NODE_ENV = "development";

    // Should not throw
    expect(() => require("../env")).not.toThrow();
  });

  it("should reject invalid DATABASE_URL", () => {
    process.env.DATABASE_URL = "not-a-valid-url";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.NEXTAUTH_SECRET = "a".repeat(32);
    process.env.NODE_ENV = "development";

    // Should throw validation error
    expect(() => require("../env")).toThrow();
  });

  it("should reject non-PostgreSQL DATABASE_URL", () => {
    process.env.DATABASE_URL = "mysql://user:password@localhost:3306/testdb";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.NEXTAUTH_SECRET = "a".repeat(32);
    process.env.NODE_ENV = "development";

    // Should throw validation error
    expect(() => require("../env")).toThrow();
  });

  it("should reject short NEXTAUTH_SECRET", () => {
    process.env.DATABASE_URL =
      "postgresql://user:password@localhost:5432/testdb";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.NEXTAUTH_SECRET = "too-short"; // Less than 32 characters
    process.env.NODE_ENV = "development";

    // Should throw validation error
    expect(() => require("../env")).toThrow();
  });

  it("should reject invalid NEXTAUTH_URL", () => {
    process.env.DATABASE_URL =
      "postgresql://user:password@localhost:5432/testdb";
    process.env.NEXTAUTH_URL = "not-a-url";
    process.env.NEXTAUTH_SECRET = "a".repeat(32);
    process.env.NODE_ENV = "development";

    // Should throw validation error
    expect(() => require("../env")).toThrow();
  });

  it("should reject invalid NODE_ENV", () => {
    process.env.DATABASE_URL =
      "postgresql://user:password@localhost:5432/testdb";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.NEXTAUTH_SECRET = "a".repeat(32);
    process.env.NODE_ENV = "invalid"; // Not in enum

    // Should throw validation error
    expect(() => require("../env")).toThrow();
  });

  it("should use default NODE_ENV if not provided", () => {
    process.env.DATABASE_URL =
      "postgresql://user:password@localhost:5432/testdb";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.NEXTAUTH_SECRET = "a".repeat(32);
    delete process.env.NODE_ENV;

    // Should not throw and use default 'development'
    expect(() => require("../env")).not.toThrow();
  });

  it("should reject missing required variables", () => {
    process.env = {}; // Clear all env vars

    // Should throw validation error
    expect(() => require("../env")).toThrow();
  });
});

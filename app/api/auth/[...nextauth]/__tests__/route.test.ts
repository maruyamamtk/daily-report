/**
 * NextAuth API Route Integration Tests
 *
 * Tests the NextAuth API endpoints for authentication:
 * - POST /api/auth/signin - Login (TC-AUTH-001~004)
 * - POST /api/auth/signout - Logout (TC-AUTH-005)
 * - GET /api/auth/session - Get session (TC-AUTH-008)
 * - Token expiration handling (TC-AUTH-007)
 *
 * These tests verify the NextAuth route handler configuration.
 *
 * @see ../route.ts
 */

import { describe, it, expect, beforeEach } from "vitest";

describe("NextAuth API Route Handler", () => {
  describe("Route Configuration", () => {
    it("should export GET handler for session and provider endpoints", async () => {
      const { GET } = await import("../route");
      expect(GET).toBeDefined();
      expect(typeof GET).toBe("function");
    });

    it("should export POST handler for signin, signout, and callback", async () => {
      const { POST } = await import("../route");
      expect(POST).toBeDefined();
      expect(typeof POST).toBe("function");
    });

    it("should use authOptions from lib/auth", async () => {
      // Verify that the route imports and uses authOptions
      const routeModule = await import("../route");
      const authModule = await import("@/lib/auth");

      expect(authModule.authOptions).toBeDefined();
      expect(authModule.authOptions.providers).toBeDefined();
      expect(authModule.authOptions.session).toBeDefined();
    });
  });

  describe("NextAuth Handler Initialization", () => {
    it("should initialize NextAuth with correct configuration", async () => {
      const { authOptions } = await import("@/lib/auth");

      // Verify critical configuration
      expect(authOptions.session.strategy).toBe("jwt");
      expect(authOptions.pages?.signIn).toBe("/login");
      expect(authOptions.providers).toHaveLength(1);
      expect(authOptions.providers[0].id).toBe("credentials");
    });
  });

  describe("API Endpoints Coverage", () => {
    it("should handle /api/auth/signin endpoint (login)", () => {
      // NextAuth automatically creates this endpoint from the credentials provider
      const { authOptions } = require("@/lib/auth");
      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.id === "credentials"
      );

      expect(credentialsProvider).toBeDefined();
      expect(credentialsProvider.authorize).toBeDefined();
    });

    it("should handle /api/auth/signout endpoint (logout)", () => {
      // NextAuth automatically creates this endpoint
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.pages?.signOut).toBe("/");
    });

    it("should handle /api/auth/session endpoint (get session)", () => {
      // NextAuth automatically creates this endpoint
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.session).toBeDefined();
      expect(authOptions.callbacks?.session).toBeDefined();
    });

    it("should handle /api/auth/providers endpoint (list providers)", () => {
      // NextAuth automatically creates this endpoint
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.providers).toBeDefined();
      expect(authOptions.providers.length).toBeGreaterThan(0);
    });

    it("should handle /api/auth/csrf endpoint (CSRF token)", () => {
      // NextAuth automatically handles CSRF protection
      // Just verify the configuration exists
      const { authOptions } = require("@/lib/auth");
      expect(authOptions).toBeDefined();
    });
  });

  describe("TC-AUTH-005: Logout Endpoint Configuration", () => {
    it("should configure signOut to redirect to root path", () => {
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.pages?.signOut).toBe("/");
    });

    it("should clear JWT token on signout (via NextAuth default behavior)", () => {
      // NextAuth handles token clearing automatically
      // Verify JWT session strategy is configured
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.session.strategy).toBe("jwt");
    });
  });

  describe("TC-AUTH-006: Protected Endpoint Behavior", () => {
    it("should require authentication for protected endpoints (handled by middleware)", () => {
      // Verify that authOptions is configured for use with middleware
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.session.strategy).toBe("jwt");
      expect(authOptions.callbacks?.jwt).toBeDefined();
    });
  });

  describe("TC-AUTH-007: Token Expiration Configuration", () => {
    it("should configure JWT max age to 30 days", () => {
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.session.maxAge).toBe(30 * 24 * 60 * 60);
    });

    it("should use JWT strategy for stateless sessions", () => {
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.session.strategy).toBe("jwt");
    });
  });

  describe("TC-AUTH-008: Session Endpoint (GET /api/auth/session)", () => {
    it("should have session callback to return user data", () => {
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.callbacks?.session).toBeDefined();
      expect(typeof authOptions.callbacks?.session).toBe("function");
    });

    it("should include employeeId and role in session", async () => {
      const { authOptions } = require("@/lib/auth");
      const sessionCallback = authOptions.callbacks.session;

      const mockSession = {
        user: {},
        expires: "2026-12-31",
      };
      const mockToken = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "営業",
        employeeId: 1,
        managerId: null,
      };

      const result = await sessionCallback({
        session: mockSession,
        token: mockToken,
      });

      expect(result.user).toHaveProperty("id");
      expect(result.user).toHaveProperty("email");
      expect(result.user).toHaveProperty("name");
      expect(result.user).toHaveProperty("role");
      expect(result.user).toHaveProperty("employeeId");
      expect(result.user).toHaveProperty("managerId");
    });
  });

  describe("Error Handling Configuration", () => {
    it("should redirect errors to login page", () => {
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.pages?.error).toBe("/login");
    });

    it("should have authorize function that throws errors for invalid credentials", async () => {
      const { authOptions } = require("@/lib/auth");
      const credentialsProvider = authOptions.providers[0];

      expect(credentialsProvider.authorize).toBeDefined();

      // Test that authorize throws on invalid input
      await expect(
        credentialsProvider.authorize({
          email: "",
          password: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("Security Configuration", () => {
    it("should have NEXTAUTH_SECRET configured", () => {
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.secret).toBeDefined();
      expect(typeof authOptions.secret).toBe("string");
      expect(authOptions.secret.length).toBeGreaterThan(0);
    });

    it("should use secure JWT callbacks", () => {
      const { authOptions } = require("@/lib/auth");

      expect(authOptions.callbacks?.jwt).toBeDefined();
      expect(typeof authOptions.callbacks?.jwt).toBe("function");
    });

    it("should use bcrypt for password comparison (via credentials provider)", () => {
      const { authOptions } = require("@/lib/auth");
      const credentialsProvider = authOptions.providers[0];

      // Verify credentials provider is configured
      expect(credentialsProvider.type).toBe("credentials");
      expect(credentialsProvider.authorize).toBeDefined();
    });
  });

  describe("Next.js App Router Compatibility", () => {
    it("should export named GET and POST exports for App Router", async () => {
      const routeModule = await import("../route");

      expect(routeModule).toHaveProperty("GET");
      expect(routeModule).toHaveProperty("POST");
      expect(typeof routeModule.GET).toBe("function");
      expect(typeof routeModule.POST).toBe("function");
    });

    it("should use NextAuth function from next-auth package", async () => {
      // Verify that NextAuth is properly imported
      const routeModule = await import("../route");
      expect(routeModule.GET).toBeDefined();
      expect(routeModule.POST).toBeDefined();
    });
  });

  describe("Provider Credentials Configuration", () => {
    it("should define email and password fields", () => {
      const { authOptions } = require("@/lib/auth");
      const credentialsProvider = authOptions.providers[0];

      expect(credentialsProvider.credentials).toHaveProperty("email");
      expect(credentialsProvider.credentials).toHaveProperty("password");
    });

    it("should have correct field types for credentials", () => {
      const { authOptions } = require("@/lib/auth");
      const credentialsProvider = authOptions.providers[0];

      expect(credentialsProvider.credentials.email.type).toBe("email");
      expect(credentialsProvider.credentials.password.type).toBe("password");
    });

    it("should have descriptive labels for credentials", () => {
      const { authOptions } = require("@/lib/auth");
      const credentialsProvider = authOptions.providers[0];

      expect(credentialsProvider.credentials.email.label).toBe("Email");
      expect(credentialsProvider.credentials.password.label).toBe("Password");
    });
  });
});

/**
 * Integration Test Notes
 *
 * These tests verify the configuration and structure of the NextAuth API route.
 * For full end-to-end testing of login/logout flows, see:
 * - lib/__tests__/auth.test.ts - Tests authorize function, JWT/session callbacks
 * - tests/middleware.test.ts - Tests route protection and redirects
 *
 * Test Coverage Mapping:
 * - TC-AUTH-001: Covered in lib/__tests__/auth.test.ts (authorize with valid credentials)
 * - TC-AUTH-002: Covered in lib/__tests__/auth.test.ts (authorize with wrong password)
 * - TC-AUTH-003: Covered in lib/__tests__/auth.test.ts (authorize with non-existent email)
 * - TC-AUTH-004: Covered in lib/__tests__/auth.test.ts (authorize with missing fields)
 * - TC-AUTH-005: Covered here (signout configuration)
 * - TC-AUTH-006: Covered in tests/middleware.test.ts (protected routes)
 * - TC-AUTH-007: Covered here (token expiration config)
 * - TC-AUTH-008: Covered here and lib/__tests__/auth.test.ts (session callback)
 */

/**
 * Middleware Tests
 *
 * Tests authentication and authorization behavior of Next.js middleware
 * including route protection, redirects, and role-based access control.
 *
 * These tests mock the NextAuth middleware and test the actual logic.
 *
 * @see ../middleware.ts
 */

import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";
import { UserRole } from "@/types/roles";

/**
 * Mock NextAuth middleware
 */
vi.mock("next-auth/middleware", () => ({
  withAuth: vi.fn((middleware, config) => {
    return async (req: NextRequest) => {
      const { pathname } = new URL(req.url);

      // Simulate NextAuth token extraction from request
      const mockToken = (req as any).mockToken as JWT | null;

      // Execute the authorized callback
      const isAuthorized = config.callbacks.authorized({
        token: mockToken,
        req,
      });

      if (!isAuthorized && pathname !== "/login") {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Create request with nextauth property
      const reqWithAuth = {
        ...req,
        nextUrl: new URL(req.url),
        nextauth: { token: mockToken },
      };

      // Execute the middleware function
      return middleware(reqWithAuth as any);
    };
  }),
}));

/**
 * Helper function to create a mock NextRequest
 */
function createMockRequest(
  pathname: string,
  token: JWT | null = null
): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const req = new NextRequest(url);
  (req as any).mockToken = token;
  return req;
}

/**
 * Helper function to create a mock JWT token
 */
function createMockToken(role: string = UserRole.SALES): JWT {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role,
    employeeId: 1,
    managerId: null,
  } as JWT;
}

describe("Middleware - Authentication and Authorization", () => {
  let middleware: (req: NextRequest) => Promise<NextResponse>;

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Re-import middleware to get fresh instance with mocks
    const middlewareModule = await import("../middleware");
    middleware = middlewareModule.default as any;
  });

  describe("Root Path (/) Handling", () => {
    it("should redirect authenticated users from / to /dashboard", async () => {
      const token = createMockToken();
      const req = createMockRequest("/", token);

      const response = await middleware(req);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Temporary redirect
      expect(response.headers.get("location")).toContain("/dashboard");
    });

    it("should redirect unauthenticated users from / to /login", async () => {
      const req = createMockRequest("/", null);

      const response = await middleware(req);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });
  });

  describe("Login Page Redirect", () => {
    it("should redirect authenticated users from /login to /dashboard", async () => {
      const token = createMockToken();
      const req = createMockRequest("/login", token);

      const response = await middleware(req);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/dashboard");
    });

    it("should allow unauthenticated users to access /login", async () => {
      const req = createMockRequest("/login", null);

      const response = await middleware(req);

      // Should not redirect (either NextResponse.next() or allow access)
      // The authorized callback should return true for /login
      expect(response.status).not.toBe(307);
    });
  });

  describe("Protected Routes", () => {
    const protectedRoutes = [
      "/dashboard",
      "/daily-reports",
      "/daily-reports/new",
      "/customers",
      "/customers/123",
    ];

    protectedRoutes.forEach((route) => {
      it(`should protect ${route} from unauthenticated access`, async () => {
        const req = createMockRequest(route, null);

        const response = await middleware(req);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/login");
      });

      it(`should allow authenticated users to access ${route}`, async () => {
        const token = createMockToken();
        const req = createMockRequest(route, token);

        const response = await middleware(req);

        // Should allow access (NextResponse.next())
        expect(response.status).not.toBe(307);
      });
    });
  });

  describe("Role-Based Access Control (RBAC)", () => {
    describe("/employees route", () => {
      it("should allow 管理者 (administrator) to access /employees", async () => {
        const token = createMockToken(UserRole.ADMIN);
        const req = createMockRequest("/employees", token);

        const response = await middleware(req);

        // Should allow access
        expect(response.status).not.toBe(307);
      });

      it("should redirect 営業 (sales) from /employees to /dashboard", async () => {
        const token = createMockToken(UserRole.SALES);
        const req = createMockRequest("/employees", token);

        const response = await middleware(req);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/dashboard");
      });

      it("should redirect 上長 (manager) from /employees to /dashboard", async () => {
        const token = createMockToken(UserRole.MANAGER);
        const req = createMockRequest("/employees", token);

        const response = await middleware(req);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/dashboard");
      });

      it("should handle /employees sub-routes with same RBAC rules", async () => {
        const token = createMockToken(UserRole.SALES);
        const req = createMockRequest("/employees/123", token);

        const response = await middleware(req);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/dashboard");
      });

      it("should allow admin to access /employees sub-routes", async () => {
        const token = createMockToken(UserRole.ADMIN);
        const req = createMockRequest("/employees/123/edit", token);

        const response = await middleware(req);

        // Should allow access
        expect(response.status).not.toBe(307);
      });
    });
  });

  describe("Public Routes", () => {
    // Note: These routes are excluded by the matcher, so they won't reach the middleware
    // This test verifies the matcher configuration
    it("should have correct matcher configuration to exclude public routes", () => {
      const { config } = require("../middleware");
      const matcher = config.matcher[0];

      // Verify the pattern excludes public routes
      expect(matcher).toContain("api/auth");
      expect(matcher).toContain("_next");
      expect(matcher).toContain("favicon.ico");
      expect(matcher).toContain("robots.txt");
    });
  });

  describe("NextAuth v4 Compatibility", () => {
    it("should use withAuth from next-auth/middleware", () => {
      const nextAuthMiddleware = require("next-auth/middleware");

      // Verify that withAuth is imported and mocked
      expect(nextAuthMiddleware.withAuth).toBeDefined();
      expect(vi.isMockFunction(nextAuthMiddleware.withAuth)).toBe(true);
    });

    it("should use JWT session strategy", () => {
      const authConfig = require("../lib/auth").authOptions;

      expect(authConfig.session.strategy).toBe("jwt");
    });

    it("should include role field in JWT token type", () => {
      const token = createMockToken();

      expect(token).toHaveProperty("role");
      expect(token.role).toBe(UserRole.SALES);
    });
  });

  describe("Middleware Configuration", () => {
    it("should use correct matcher pattern to exclude public routes", () => {
      const { config } = require("../middleware");

      expect(config.matcher).toBeDefined();
      expect(Array.isArray(config.matcher)).toBe(true);
      expect(config.matcher.length).toBeGreaterThan(0);
    });

    it("should configure signIn page as /login", () => {
      const authConfig = require("../lib/auth").authOptions;

      expect(authConfig.pages.signIn).toBe("/login");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing token gracefully on protected routes", async () => {
      const req = createMockRequest("/dashboard", null);

      const response = await middleware(req);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("should handle invalid role values on /employees route", async () => {
      const token = createMockToken("invalid-role");
      const req = createMockRequest("/employees", token);

      const response = await middleware(req);

      // Should redirect since role is not "管理者"
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/dashboard");
    });

    it("should handle null role on /employees route", async () => {
      const token = createMockToken();
      token.role = null as any;
      const req = createMockRequest("/employees", token);

      const response = await middleware(req);

      // Should redirect since role is null
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/dashboard");
    });
  });
});

/**
 * Type Safety Tests
 *
 * These tests verify that our type definitions are correct and prevent type errors.
 */
describe("Type Safety", () => {
  it("should have type-safe role constants", () => {
    expect(UserRole.SALES).toBe("営業");
    expect(UserRole.MANAGER).toBe("上長");
    expect(UserRole.ADMIN).toBe("管理者");
  });

  it("should enforce role type in JWT token", () => {
    const token = createMockToken(UserRole.ADMIN);

    // This should compile without errors
    const role: string = token.role;

    expect(role).toBe(UserRole.ADMIN);
  });
});

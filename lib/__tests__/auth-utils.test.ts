/**
 * Tests for Server Components Authentication Utilities
 *
 * Tests authentication and authorization logic for Server Components,
 * including role-based access control and redirect behavior.
 *
 * @see ../auth-utils.ts
 */

import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { UserRole } from "@/types/roles";
import type { Session } from "next-auth";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT: ${url}`);
  }),
}));

// Import modules after mocking
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import * as authUtils from "../auth-utils";

/**
 * Helper function to create a mock session
 */
function createMockSession(
  role: string = UserRole.SALES,
  employeeId: number = 1,
  managerId: number | null = null
): Session {
  return {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      role,
      employeeId,
      managerId,
    },
    expires: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
  };
}

describe("auth-utils - Server Components Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentSession", () => {
    it("should return session when authenticated", async () => {
      const mockSession = createMockSession();
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const session = await authUtils.getCurrentSession();

      expect(session).toEqual(mockSession);
      expect(getServerSession).toHaveBeenCalledTimes(1);
    });

    it("should return null when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const session = await authUtils.getCurrentSession();

      expect(session).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("should return user from session", async () => {
      const mockSession = createMockSession();
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const user = await authUtils.getCurrentUser();

      expect(user).toEqual(mockSession.user);
    });

    it("should return null when session is null", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const user = await authUtils.getCurrentUser();

      expect(user).toBeNull();
    });

    it("should return null when session.user is undefined", async () => {
      (getServerSession as Mock).mockResolvedValue({ expires: "2026-01-01" });

      const user = await authUtils.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("should return user when authenticated", async () => {
      const mockSession = createMockSession();
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const user = await authUtils.requireAuth();

      expect(user).toEqual(mockSession.user);
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should redirect to /login when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      await expect(authUtils.requireAuth()).rejects.toThrow("REDIRECT: /login");
      expect(redirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("requireRole", () => {
    it("should return user when user has required role (single role)", async () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const user = await authUtils.requireRole(UserRole.ADMIN);

      expect(user).toEqual(mockSession.user);
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should return user when user has one of the allowed roles (array)", async () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const user = await authUtils.requireRole([UserRole.MANAGER, UserRole.ADMIN]);

      expect(user).toEqual(mockSession.user);
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should redirect to /forbidden when user lacks required role (single role)", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      await expect(authUtils.requireRole(UserRole.ADMIN)).rejects.toThrow("REDIRECT: /forbidden");
      expect(redirect).toHaveBeenCalledWith("/forbidden");
    });

    it("should redirect to /forbidden when user lacks required role (array)", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      await expect(
        authUtils.requireRole([UserRole.MANAGER, UserRole.ADMIN])
      ).rejects.toThrow("REDIRECT: /forbidden");
      expect(redirect).toHaveBeenCalledWith("/forbidden");
    });

    it("should redirect to /login when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      await expect(authUtils.requireRole(UserRole.ADMIN)).rejects.toThrow("REDIRECT: /login");
      expect(redirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("hasUserRole", () => {
    it("should return true when user has the specified role", async () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.hasUserRole(UserRole.MANAGER);

      expect(result).toBe(true);
    });

    it("should return false when user has a different role", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.hasUserRole(UserRole.ADMIN);

      expect(result).toBe(false);
    });

    it("should return false when user is not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const result = await authUtils.hasUserRole(UserRole.SALES);

      expect(result).toBe(false);
    });
  });

  describe("isCurrentUserAdmin", () => {
    it("should return true when user is admin", async () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.isCurrentUserAdmin();

      expect(result).toBe(true);
    });

    it("should return false when user is not admin", async () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.isCurrentUserAdmin();

      expect(result).toBe(false);
    });

    it("should return false when user is not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const result = await authUtils.isCurrentUserAdmin();

      expect(result).toBe(false);
    });
  });

  describe("isCurrentUserManager", () => {
    it("should return true when user is manager", async () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.isCurrentUserManager();

      expect(result).toBe(true);
    });

    it("should return false when user is not manager", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.isCurrentUserManager();

      expect(result).toBe(false);
    });

    it("should return false when user is not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const result = await authUtils.isCurrentUserManager();

      expect(result).toBe(false);
    });
  });

  describe("canComment", () => {
    it("should return true for managers", async () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canComment();

      expect(result).toBe(true);
    });

    it("should return true for admins", async () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canComment();

      expect(result).toBe(true);
    });

    it("should return false for sales", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canComment();

      expect(result).toBe(false);
    });

    it("should return false when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const result = await authUtils.canComment();

      expect(result).toBe(false);
    });
  });

  describe("canAccessEmployeeManagement", () => {
    it("should return true for admins", async () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canAccessEmployeeManagement();

      expect(result).toBe(true);
    });

    it("should return false for managers", async () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canAccessEmployeeManagement();

      expect(result).toBe(false);
    });

    it("should return false for sales", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canAccessEmployeeManagement();

      expect(result).toBe(false);
    });

    it("should return false when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const result = await authUtils.canAccessEmployeeManagement();

      expect(result).toBe(false);
    });
  });

  describe("canEditReport", () => {
    it("should return true when user is the report owner", async () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canEditReport(1);

      expect(result).toBe(true);
    });

    it("should return false when user is not the report owner", async () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canEditReport(2);

      expect(result).toBe(false);
    });

    it("should return false when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const result = await authUtils.canEditReport(1);

      expect(result).toBe(false);
    });

    it("should enforce ownership even for admins", async () => {
      const mockSession = createMockSession(UserRole.ADMIN, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canEditReport(2);

      expect(result).toBe(false);
    });
  });

  describe("canViewReport", () => {
    it("should allow admin to view any report", async () => {
      const mockSession = createMockSession(UserRole.ADMIN, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canViewReport(999, 888);

      expect(result).toBe(true);
    });

    it("should allow user to view their own report", async () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canViewReport(1, null);

      expect(result).toBe(true);
    });

    it("should allow manager to view subordinate report", async () => {
      const mockSession = createMockSession(UserRole.MANAGER, 10);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canViewReport(20, 10);

      expect(result).toBe(true);
    });

    it("should deny sales viewing other's report", async () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canViewReport(2, null);

      expect(result).toBe(false);
    });

    it("should deny manager viewing non-subordinate report", async () => {
      const mockSession = createMockSession(UserRole.MANAGER, 10);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canViewReport(20, 99);

      expect(result).toBe(false);
    });

    it("should deny when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const result = await authUtils.canViewReport(1, null);

      expect(result).toBe(false);
    });

    it("should handle null manager ID correctly", async () => {
      const mockSession = createMockSession(UserRole.MANAGER, 10);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canViewReport(20, null);

      expect(result).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing user in session", async () => {
      (getServerSession as Mock).mockResolvedValue({ expires: "2026-01-01" });

      const user = await authUtils.getCurrentUser();
      expect(user).toBeNull();
    });

    it("should handle undefined session", async () => {
      (getServerSession as Mock).mockResolvedValue(undefined);

      const user = await authUtils.getCurrentUser();
      expect(user).toBeNull();
    });

    it("should handle null employeeId in session", async () => {
      const mockSession = createMockSession(UserRole.SALES, null as any);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const result = await authUtils.canEditReport(1);
      expect(result).toBe(false);
    });
  });
});

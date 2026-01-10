/**
 * Tests for API Route Authentication Utilities
 *
 * Tests authentication and authorization logic for API Routes,
 * including role-based access control and error response handling.
 *
 * @see ../api-auth.ts
 */

import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { UserRole } from "@/types/roles";
import type { Session } from "next-auth";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Import modules after mocking
import { getServerSession } from "next-auth";
import * as apiAuth from "../api-auth";

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
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

describe("api-auth - API Route Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("unauthorizedResponse", () => {
    it("should return 401 response with default message", async () => {
      const response = apiAuth.unauthorizedResponse();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toEqual({ error: "認証が必要です" });
    });

    it("should return 401 response with custom message", async () => {
      const customMessage = "カスタムエラーメッセージ";
      const response = apiAuth.unauthorizedResponse(customMessage);

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toEqual({ error: customMessage });
    });
  });

  describe("forbiddenResponse", () => {
    it("should return 403 response with default message", async () => {
      const response = apiAuth.forbiddenResponse();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body).toEqual({ error: "この操作を実行する権限がありません" });
    });

    it("should return 403 response with custom message", async () => {
      const customMessage = "カスタム権限エラー";
      const response = apiAuth.forbiddenResponse(customMessage);

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body).toEqual({ error: customMessage });
    });
  });

  describe("getApiSession", () => {
    it("should return session when authenticated", async () => {
      const mockSession = createMockSession();
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const session = await apiAuth.getApiSession();

      expect(session).toEqual(mockSession);
      expect(getServerSession).toHaveBeenCalledTimes(1);
    });

    it("should return null when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const session = await apiAuth.getApiSession();

      expect(session).toBeNull();
    });
  });

  describe("getApiUser", () => {
    it("should return user from session", async () => {
      const mockSession = createMockSession();
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const user = await apiAuth.getApiUser();

      expect(user).toEqual(mockSession.user);
    });

    it("should return null when session is null", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const user = await apiAuth.getApiUser();

      expect(user).toBeNull();
    });

    it("should return null when session.user is undefined", async () => {
      (getServerSession as Mock).mockResolvedValue({ expires: "2026-01-01" });

      const user = await apiAuth.getApiUser();

      expect(user).toBeNull();
    });
  });

  describe("requireApiAuth", () => {
    it("should return user when authenticated", async () => {
      const mockSession = createMockSession();
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { user, error } = await apiAuth.requireApiAuth();

      expect(user).toEqual(mockSession.user);
      expect(error).toBeNull();
    });

    it("should return 401 error when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const { user, error } = await apiAuth.requireApiAuth();

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(401);

      const body = await error!.json();
      expect(body).toEqual({ error: "認証が必要です" });
    });
  });

  describe("requireApiRole", () => {
    it("should return user when user has required role (single role)", async () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { user, error } = await apiAuth.requireApiRole(UserRole.ADMIN);

      expect(user).toEqual(mockSession.user);
      expect(error).toBeNull();
    });

    it("should return user when user has one of the allowed roles (array)", async () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { user, error } = await apiAuth.requireApiRole([
        UserRole.MANAGER,
        UserRole.ADMIN,
      ]);

      expect(user).toEqual(mockSession.user);
      expect(error).toBeNull();
    });

    it("should return 403 error when user lacks required role (single role)", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { user, error } = await apiAuth.requireApiRole(UserRole.ADMIN);

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);

      const body = await error!.json();
      expect(body).toEqual({ error: "この操作を実行する権限がありません" });
    });

    it("should return 403 error when user lacks required role (array)", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { user, error } = await apiAuth.requireApiRole([
        UserRole.MANAGER,
        UserRole.ADMIN,
      ]);

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);
    });

    it("should return 401 error when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const { user, error } = await apiAuth.requireApiRole(UserRole.ADMIN);

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(401);
    });
  });

  describe("canApiComment", () => {
    it("should allow managers to comment", async () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canComment, user, error } = await apiAuth.canApiComment();

      expect(canComment).toBe(true);
      expect(user).toEqual(mockSession.user);
      expect(error).toBeNull();
    });

    it("should allow admins to comment", async () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canComment, user, error } = await apiAuth.canApiComment();

      expect(canComment).toBe(true);
      expect(user).toEqual(mockSession.user);
      expect(error).toBeNull();
    });

    it("should deny sales from commenting", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canComment, error } = await apiAuth.canApiComment();

      expect(canComment).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);

      const body = await error!.json();
      expect(body).toEqual({ error: "コメントを投稿する権限がありません" });
    });

    it("should return 401 when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const { canComment, error } = await apiAuth.canApiComment();

      expect(canComment).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(401);
    });
  });

  describe("canApiEditReport", () => {
    it("should allow user to edit their own report", async () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canEdit, user, error } = await apiAuth.canApiEditReport(1);

      expect(canEdit).toBe(true);
      expect(user).toEqual(mockSession.user);
      expect(error).toBeNull();
    });

    it("should deny user from editing other's report", async () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canEdit, error } = await apiAuth.canApiEditReport(2);

      expect(canEdit).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);

      const body = await error!.json();
      expect(body).toEqual({ error: "自分の日報のみ編集できます" });
    });

    it("should return 401 when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const { canEdit, error } = await apiAuth.canApiEditReport(1);

      expect(canEdit).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(401);
    });

    it("should enforce ownership even for admins", async () => {
      const mockSession = createMockSession(UserRole.ADMIN, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canEdit, error } = await apiAuth.canApiEditReport(2);

      expect(canEdit).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);
    });
  });

  describe("canApiViewReport", () => {
    it("should allow admin to view any report", async () => {
      const mockSession = createMockSession(UserRole.ADMIN, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canView, user, error } = await apiAuth.canApiViewReport(999, 888);

      expect(canView).toBe(true);
      expect(user).toEqual(mockSession.user);
      expect(error).toBeNull();
    });

    it("should allow user to view their own report", async () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canView, user, error } = await apiAuth.canApiViewReport(1, null);

      expect(canView).toBe(true);
      expect(user).toEqual(mockSession.user);
      expect(error).toBeNull();
    });

    it("should allow manager to view subordinate report", async () => {
      const mockSession = createMockSession(UserRole.MANAGER, 10);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canView, user, error } = await apiAuth.canApiViewReport(20, 10);

      expect(canView).toBe(true);
      expect(user).toEqual(mockSession.user);
      expect(error).toBeNull();
    });

    it("should deny sales from viewing other's report", async () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canView, error } = await apiAuth.canApiViewReport(2, null);

      expect(canView).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);

      const body = await error!.json();
      expect(body).toEqual({ error: "この日報を閲覧する権限がありません" });
    });

    it("should deny manager from viewing non-subordinate report", async () => {
      const mockSession = createMockSession(UserRole.MANAGER, 10);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canView, error } = await apiAuth.canApiViewReport(20, 99);

      expect(canView).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);
    });

    it("should return 401 when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const { canView, error } = await apiAuth.canApiViewReport(1, null);

      expect(canView).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(401);
    });

    it("should handle null manager ID correctly", async () => {
      const mockSession = createMockSession(UserRole.MANAGER, 10);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canView, error } = await apiAuth.canApiViewReport(20, null);

      expect(canView).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);
    });
  });

  describe("canApiAccessEmployeeManagement", () => {
    it("should allow admins to access employee management", async () => {
      const mockSession = createMockSession(UserRole.ADMIN);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { user, error } = await apiAuth.canApiAccessEmployeeManagement();

      expect(user).toEqual(mockSession.user);
      expect(error).toBeNull();
    });

    it("should deny managers from accessing employee management", async () => {
      const mockSession = createMockSession(UserRole.MANAGER);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { user, error } = await apiAuth.canApiAccessEmployeeManagement();

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);
    });

    it("should deny sales from accessing employee management", async () => {
      const mockSession = createMockSession(UserRole.SALES);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { user, error } = await apiAuth.canApiAccessEmployeeManagement();

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);
    });

    it("should return 401 when not authenticated", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const { user, error } = await apiAuth.canApiAccessEmployeeManagement();

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(401);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing user in session", async () => {
      (getServerSession as Mock).mockResolvedValue({ expires: "2026-01-01" });

      const user = await apiAuth.getApiUser();
      expect(user).toBeNull();
    });

    it("should handle undefined session", async () => {
      (getServerSession as Mock).mockResolvedValue(undefined);

      const user = await apiAuth.getApiUser();
      expect(user).toBeNull();
    });

    it("should handle null employeeId in session for canApiEditReport", async () => {
      const mockSession = createMockSession(UserRole.SALES, null as any);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canEdit, error } = await apiAuth.canApiEditReport(1);

      expect(canEdit).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);
    });

    it("should handle null employeeId in session for canApiViewReport", async () => {
      const mockSession = createMockSession(UserRole.SALES, null as any);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { canView, error } = await apiAuth.canApiViewReport(1, null);

      expect(canView).toBe(false);
      expect(error).toBeInstanceOf(Response);
      expect(error!.status).toBe(403);
    });
  });

  describe("Response Error Format Consistency", () => {
    it("should return consistent error format for 401 responses", async () => {
      (getServerSession as Mock).mockResolvedValue(null);

      const { error: authError } = await apiAuth.requireApiAuth();
      const { error: roleError } = await apiAuth.requireApiRole(UserRole.ADMIN);
      const { error: commentError } = await apiAuth.canApiComment();
      const { error: editError } = await apiAuth.canApiEditReport(1);
      const { error: viewError } = await apiAuth.canApiViewReport(1, null);

      // All 401 errors should have same status
      expect(authError!.status).toBe(401);
      expect(roleError!.status).toBe(401);
      expect(commentError!.status).toBe(401);
      expect(editError!.status).toBe(401);
      expect(viewError!.status).toBe(401);

      // All should have error field
      const authBody = await authError!.json();
      expect(authBody).toHaveProperty("error");
      expect(typeof authBody.error).toBe("string");
    });

    it("should return consistent error format for 403 responses", async () => {
      const mockSession = createMockSession(UserRole.SALES, 1);
      (getServerSession as Mock).mockResolvedValue(mockSession);

      const { error: roleError } = await apiAuth.requireApiRole(UserRole.ADMIN);
      const { error: commentError } = await apiAuth.canApiComment();
      const { error: editError } = await apiAuth.canApiEditReport(2);
      const { error: viewError } = await apiAuth.canApiViewReport(2, null);

      // All 403 errors should have same status
      expect(roleError!.status).toBe(403);
      expect(commentError!.status).toBe(403);
      expect(editError!.status).toBe(403);
      expect(viewError!.status).toBe(403);

      // All should have error field
      const roleBody = await roleError!.json();
      expect(roleBody).toHaveProperty("error");
      expect(typeof roleBody.error).toBe("string");
    });
  });
});

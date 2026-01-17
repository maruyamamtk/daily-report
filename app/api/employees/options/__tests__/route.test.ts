/**
 * Tests for Employees Options API Route - GET (options)
 *
 * 営業マスタオプションAPI（選択肢取得）エンドポイントの包括的なテスト
 *
 * @see ../route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

// Mock Prisma
const mockPrismaEmployee = {
  findMany: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    employee: mockPrismaEmployee,
  },
}));

// Mock requireApiAuth
const mockRequireApiAuth = vi.fn();
vi.mock("@/lib/api-auth", () => ({
  requireApiAuth: mockRequireApiAuth,
}));

/**
 * Helper function to create a mock user
 */
function createMockUser(role: string = "営業", employeeId: number = 1) {
  return {
    id: "test-user-id",
    email: "user@example.com",
    name: "Test User",
    role,
    employeeId,
    managerId: null,
  };
}

/**
 * Helper function to create mock employee option data
 */
function createMockEmployeeOption(id: number) {
  return {
    id,
    name: `Employee ${id}`,
  };
}

describe("Employees Options API - GET /api/employees/options", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("認証", () => {
    it("should return 401 when not authenticated", async () => {
      mockRequireApiAuth.mockResolvedValueOnce({
        error: new Response(
          JSON.stringify({
            error: { code: "UNAUTHORIZED", message: "認証が必要です" },
          }),
          { status: 401 }
        ),
        user: null,
      });

      const request = {} as NextRequest;
      const response = await GET(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({
        error: { code: "UNAUTHORIZED", message: "認証が必要です" },
      });
    });

    it("should allow authenticated sales users", async () => {
      const user = createMockUser("営業", 1);
      mockRequireApiAuth.mockResolvedValueOnce({ user, error: null });
      mockPrismaEmployee.findMany.mockResolvedValueOnce([]);

      const request = {} as NextRequest;
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should allow authenticated managers", async () => {
      const user = createMockUser("上長", 2);
      mockRequireApiAuth.mockResolvedValueOnce({ user, error: null });
      mockPrismaEmployee.findMany.mockResolvedValueOnce([]);

      const request = {} as NextRequest;
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should allow authenticated admins", async () => {
      const user = createMockUser("管理者", 3);
      mockRequireApiAuth.mockResolvedValueOnce({ user, error: null });
      mockPrismaEmployee.findMany.mockResolvedValueOnce([]);

      const request = {} as NextRequest;
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("営業オプション取得", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
    });

    it("should return empty list when no employees", async () => {
      mockPrismaEmployee.findMany.mockResolvedValueOnce([]);

      const request = {} as NextRequest;
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        data: [],
      });
    });

    it("should return employee options list", async () => {
      const mockEmployees = [
        createMockEmployeeOption(1),
        createMockEmployeeOption(2),
        createMockEmployeeOption(3),
      ];
      mockPrismaEmployee.findMany.mockResolvedValueOnce(mockEmployees);

      const request = {} as NextRequest;
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(3);
      expect(body.data).toEqual([
        { employee_id: 1, name: "Employee 1" },
        { employee_id: 2, name: "Employee 2" },
        { employee_id: 3, name: "Employee 3" },
      ]);
    });

    it("should fetch employees with correct query parameters", async () => {
      mockPrismaEmployee.findMany.mockResolvedValueOnce([]);

      const request = {} as NextRequest;
      await GET(request);

      expect(mockPrismaEmployee.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });
    });

    it("should return employees ordered by name", async () => {
      const mockEmployees = [
        { id: 2, name: "Bob" },
        { id: 1, name: "Alice" },
        { id: 3, name: "Charlie" },
      ];
      mockPrismaEmployee.findMany.mockResolvedValueOnce(mockEmployees);

      const request = {} as NextRequest;
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual([
        { employee_id: 2, name: "Bob" },
        { employee_id: 1, name: "Alice" },
        { employee_id: 3, name: "Charlie" },
      ]);
    });

    it("should format response correctly", async () => {
      const mockEmployees = [
        { id: 1, name: "Test Employee" },
      ];
      mockPrismaEmployee.findMany.mockResolvedValueOnce(mockEmployees);

      const request = {} as NextRequest;
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data[0]).toEqual({
        employee_id: 1,
        name: "Test Employee",
      });
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
    });

    it("should handle database error during findMany", async () => {
      mockPrismaEmployee.findMany.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = {} as NextRequest;
      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "営業情報の取得中にエラーが発生しました",
        },
      });
    });

    it("should handle unexpected errors", async () => {
      mockPrismaEmployee.findMany.mockRejectedValueOnce(
        new Error("Unexpected error")
      );

      const request = {} as NextRequest;
      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });
});

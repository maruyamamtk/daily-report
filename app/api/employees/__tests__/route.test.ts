/**
 * Tests for Employees API Routes - GET (list) and POST (create)
 *
 * 営業マスタAPI（一覧取得・作成）エンドポイントの包括的なテスト
 *
 * @see ../route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";

// Mock bcrypt
const mockBcrypt = {
  hash: vi.fn(),
};
vi.mock("bcrypt", () => ({
  default: mockBcrypt,
}));

// Mock Prisma
const mockPrismaEmployee = {
  count: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
};

const mockPrismaUser = {
  create: vi.fn(),
};

const mockPrismaTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    employee: mockPrismaEmployee,
    user: mockPrismaUser,
    $transaction: mockPrismaTransaction,
  },
}));

// Mock requireApiRole
const mockRequireApiRole = vi.fn();
vi.mock("@/lib/api-auth", () => ({
  requireApiRole: mockRequireApiRole,
}));

/**
 * Helper function to create a mock admin user
 */
function createMockAdminUser() {
  return {
    id: "admin-user-id",
    email: "admin@example.com",
    name: "Admin User",
    role: "管理者",
    employeeId: 1,
    managerId: null,
  };
}

/**
 * Helper function to create a mock request for GET
 */
function createMockGetRequest(searchParams?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/employees");
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return {
    nextUrl: url,
  } as NextRequest;
}

/**
 * Helper function to create a mock request for POST
 */
function createMockPostRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as NextRequest;
}

/**
 * Helper function to create mock employee data
 */
function createMockEmployee(id: number) {
  return {
    id,
    name: `Employee ${id}`,
    email: `employee${id}@example.com`,
    department: `Department ${id}`,
    position: `Position ${id}`,
    managerId: null,
    manager: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

describe("Employees API - GET /api/employees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("認証・認可", () => {
    it("should return 401 when not authenticated", async () => {
      mockRequireApiRole.mockResolvedValueOnce({
        error: new Response(
          JSON.stringify({
            error: { code: "UNAUTHORIZED", message: "認証が必要です" },
          }),
          { status: 401 }
        ),
        user: null,
      });

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({
        error: { code: "UNAUTHORIZED", message: "認証が必要です" },
      });
    });

    it("should return 403 when user is not admin", async () => {
      mockRequireApiRole.mockResolvedValueOnce({
        error: new Response(
          JSON.stringify({
            error: { code: "FORBIDDEN", message: "アクセス権限がありません" },
          }),
          { status: 403 }
        ),
        user: null,
      });

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        error: { code: "FORBIDDEN", message: "アクセス権限がありません" },
      });
    });

    it("should allow admin users", async () => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValueOnce({ user, error: null });
      mockPrismaEmployee.count.mockResolvedValueOnce(0);
      mockPrismaEmployee.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("営業一覧取得", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
    });

    it("should return empty list when no employees", async () => {
      mockPrismaEmployee.count.mockResolvedValueOnce(0);
      mockPrismaEmployee.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        data: [],
        meta: {
          current_page: 1,
          total_pages: 0,
          total_count: 0,
          limit: 20,
        },
      });
    });

    it("should return employee list with default pagination", async () => {
      const mockEmployees = [createMockEmployee(1), createMockEmployee(2)];
      mockPrismaEmployee.count.mockResolvedValueOnce(2);
      mockPrismaEmployee.findMany.mockResolvedValueOnce(mockEmployees);

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(2);
      expect(body.meta).toEqual({
        current_page: 1,
        total_pages: 1,
        total_count: 2,
        limit: 20,
      });
    });

    it("should handle custom page parameter", async () => {
      mockPrismaEmployee.count.mockResolvedValueOnce(50);
      mockPrismaEmployee.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest({ page: "2" });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.meta.current_page).toBe(2);
      expect(body.meta.total_pages).toBe(3);
      expect(mockPrismaEmployee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 })
      );
    });

    it("should handle custom limit parameter", async () => {
      mockPrismaEmployee.count.mockResolvedValueOnce(50);
      mockPrismaEmployee.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest({ limit: "10" });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.meta.limit).toBe(10);
      expect(mockPrismaEmployee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 })
      );
    });

    it("should cap limit at 100", async () => {
      mockPrismaEmployee.count.mockResolvedValueOnce(200);
      mockPrismaEmployee.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest({ limit: "500" });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.meta.limit).toBe(100);
    });

    it("should filter by name", async () => {
      mockPrismaEmployee.count.mockResolvedValueOnce(1);
      mockPrismaEmployee.findMany.mockResolvedValueOnce([createMockEmployee(1)]);

      const request = createMockGetRequest({ name: "Employee 1" });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrismaEmployee.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          name: { contains: "Employee 1", mode: "insensitive" },
        }),
      });
    });

    it("should filter by department", async () => {
      mockPrismaEmployee.count.mockResolvedValueOnce(1);
      mockPrismaEmployee.findMany.mockResolvedValueOnce([createMockEmployee(1)]);

      const request = createMockGetRequest({ department: "Sales" });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrismaEmployee.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          department: "Sales",
        }),
      });
    });

    it("should reject search string longer than 50 characters", async () => {
      const longName = "a".repeat(51);
      const request = createMockGetRequest({ name: longName });
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.message).toContain("検索文字列が長すぎます");
    });

    it("should format employee data correctly", async () => {
      const mockEmployee = {
        ...createMockEmployee(1),
        managerId: 2,
        manager: {
          id: 2,
          name: "Manager Name",
        },
      };
      mockPrismaEmployee.count.mockResolvedValueOnce(1);
      mockPrismaEmployee.findMany.mockResolvedValueOnce([mockEmployee]);

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data[0]).toEqual({
        employee_id: 1,
        name: "Employee 1",
        email: "employee1@example.com",
        department: "Department 1",
        position: "Position 1",
        manager_id: 2,
        manager_name: "Manager Name",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
    });

    it("should handle database error during count", async () => {
      mockPrismaEmployee.count.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockGetRequest();
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

    it("should handle database error during findMany", async () => {
      mockPrismaEmployee.count.mockResolvedValueOnce(10);
      mockPrismaEmployee.findMany.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});

describe("Employees API - POST /api/employees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("認証・認可", () => {
    it("should return 401 when not authenticated", async () => {
      mockRequireApiRole.mockResolvedValueOnce({
        error: new Response(
          JSON.stringify({
            error: { code: "UNAUTHORIZED", message: "認証が必要です" },
          }),
          { status: 401 }
        ),
        user: null,
      });

      const request = createMockPostRequest({
        name: "Test Employee",
        email: "test@example.com",
        password: "Test1234!",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should return 403 when user is not admin", async () => {
      mockRequireApiRole.mockResolvedValueOnce({
        error: new Response(
          JSON.stringify({
            error: { code: "FORBIDDEN", message: "アクセス権限がありません" },
          }),
          { status: 403 }
        ),
        user: null,
      });

      const request = createMockPostRequest({
        name: "Test Employee",
        email: "test@example.com",
        password: "Test1234!",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });

  describe("バリデーション", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
    });

    it("should return 422 when name is missing", async () => {
      const request = createMockPostRequest({
        email: "test@example.com",
        password: "Test1234!",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "name",
          }),
        ])
      );
    });

    it("should return 422 when name exceeds 50 characters", async () => {
      const longName = "a".repeat(51);
      const request = createMockPostRequest({
        name: longName,
        email: "test@example.com",
        password: "Test1234!",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "name",
            message: expect.stringContaining("50文字以内"),
          }),
        ])
      );
    });

    it("should return 422 when email is missing", async () => {
      const request = createMockPostRequest({
        name: "Test Employee",
        password: "Test1234!",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "email",
          }),
        ])
      );
    });

    it("should return 422 when email is invalid", async () => {
      const request = createMockPostRequest({
        name: "Test Employee",
        email: "invalid-email",
        password: "Test1234!",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "email",
            message: expect.stringContaining("メールアドレス"),
          }),
        ])
      );
    });

    it("should return 422 when password is missing", async () => {
      const request = createMockPostRequest({
        name: "Test Employee",
        email: "test@example.com",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
          }),
        ])
      );
    });

    it("should return 422 when password is too short", async () => {
      const request = createMockPostRequest({
        name: "Test Employee",
        email: "test@example.com",
        password: "Test1",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("8文字以上"),
          }),
        ])
      );
    });

    it("should return 422 when department is missing", async () => {
      const request = createMockPostRequest({
        name: "Test Employee",
        email: "test@example.com",
        password: "Test1234!",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "department",
          }),
        ])
      );
    });

    it("should return 422 when position is missing", async () => {
      const request = createMockPostRequest({
        name: "Test Employee",
        email: "test@example.com",
        password: "Test1234!",
        department: "Sales",
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "position",
          }),
        ])
      );
    });

    it("should return 409 when email already exists", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        id: 1,
        email: "test@example.com",
      });

      const request = createMockPostRequest({
        name: "Test Employee",
        email: "test@example.com",
        password: "Test1234!",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error.code).toBe("EMAIL_ALREADY_EXISTS");
      expect(body.error.message).toContain("既に使用されています");
    });

    it("should return 422 when manager does not exist", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(null); // Email check
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(null); // Manager check

      const request = createMockPostRequest({
        name: "Test Employee",
        email: "test@example.com",
        password: "Test1234!",
        department: "Sales",
        position: "Sales Rep",
        manager_id: 999,
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "manager_id",
            message: "指定された上長が見つかりません",
          }),
        ])
      );
    });
  });

  describe("営業作成", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
      mockPrismaEmployee.findUnique.mockResolvedValue(null); // Email not taken
      mockBcrypt.hash.mockResolvedValue("hashed_password");
    });

    it("should successfully create an employee with all fields", async () => {
      const mockEmployee = {
        ...createMockEmployee(1),
        managerId: 2,
        manager: { id: 2, name: "Manager Name" },
      };

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            create: vi.fn().mockResolvedValue(mockEmployee),
          },
          user: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      // Mock manager existence check
      let findUniqueCallCount = 0;
      mockPrismaEmployee.findUnique.mockImplementation(() => {
        findUniqueCallCount++;
        if (findUniqueCallCount === 1) return Promise.resolve(null); // Email check
        if (findUniqueCallCount === 2) return Promise.resolve({ id: 2 }); // Manager check
        return Promise.resolve(null);
      });

      const request = createMockPostRequest({
        name: "Employee 1",
        email: "employee1@example.com",
        password: "Test1234!",
        department: "Department 1",
        position: "Position 1",
        manager_id: 2,
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        employee_id: 1,
        name: "Employee 1",
        email: "employee1@example.com",
        department: "Department 1",
        position: "Position 1",
        manager_id: 2,
        manager_name: "Manager Name",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith("Test1234!", 10);
    });

    it("should successfully create an employee without manager", async () => {
      const mockEmployee = createMockEmployee(1);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            create: vi.fn().mockResolvedValue(mockEmployee),
          },
          user: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const request = createMockPostRequest({
        name: "Employee 1",
        email: "employee1@example.com",
        password: "Test1234!",
        department: "Department 1",
        position: "Position 1",
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.manager_id).toBeNull();
      expect(body.manager_name).toBeNull();
    });

    it("should create associated user account with default role", async () => {
      const mockEmployee = createMockEmployee(1);

      let userCreateData: any;
      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            create: vi.fn().mockResolvedValue(mockEmployee),
          },
          user: {
            create: vi.fn().mockImplementation((data) => {
              userCreateData = data.data;
              return Promise.resolve({});
            }),
          },
        });
      });

      const request = createMockPostRequest({
        name: "Employee 1",
        email: "employee1@example.com",
        password: "Test1234!",
        department: "Department 1",
        position: "Position 1",
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(userCreateData).toMatchObject({
        name: "Employee 1",
        email: "employee1@example.com",
        password: "hashed_password",
        role: "営業",
        employeeId: 1,
      });
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
      mockPrismaEmployee.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashed_password");
    });

    it("should handle database error during transaction", async () => {
      mockPrismaTransaction.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockPostRequest({
        name: "Test Employee",
        email: "test@example.com",
        password: "Test1234!",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "営業の作成中にエラーが発生しました",
        },
      });
    });

    it("should handle unique constraint violation", async () => {
      const prismaError = new Error("Unique constraint failed") as any;
      prismaError.code = "P2002";
      mockPrismaTransaction.mockRejectedValueOnce(prismaError);

      const request = createMockPostRequest({
        name: "Test Employee",
        email: "test@example.com",
        password: "Test1234!",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await POST(request);

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });
  });
});

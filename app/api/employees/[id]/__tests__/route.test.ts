/**
 * Tests for Employees API Routes - GET (detail), PUT (update), DELETE (delete)
 *
 * 営業マスタAPI（詳細取得・更新・削除）エンドポイントの包括的なテスト
 *
 * @see ../route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "../route";

// Mock bcrypt
const mockBcrypt = {
  hash: vi.fn(),
};
vi.mock("bcrypt", () => ({
  default: mockBcrypt,
}));

// Mock Prisma
const mockPrismaEmployee = {
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockPrismaUser = {
  findFirst: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
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
 * Helper function to create a mock request for PUT
 */
function createMockPutRequest(body: unknown): NextRequest {
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

describe("Employees API - GET /api/employees/[id]", () => {
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

      const request = {} as NextRequest;
      const response = await GET(request, { params: { id: "1" } });

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

      const request = {} as NextRequest;
      const response = await GET(request, { params: { id: "1" } });

      expect(response.status).toBe(403);
    });
  });

  describe("営業詳細取得", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
    });

    it("should return 400 for invalid employee ID", async () => {
      const request = {} as NextRequest;
      const response = await GET(request, { params: { id: "invalid" } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("INVALID_PARAMETER");
    });

    it("should return 404 when employee not found", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(null);

      const request = {} as NextRequest;
      const response = await GET(request, { params: { id: "999" } });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("EMPLOYEE_NOT_FOUND");
    });

    it("should successfully return employee details", async () => {
      const mockEmployee = createMockEmployee(1);
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(mockEmployee);

      const request = {} as NextRequest;
      const response = await GET(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        employee_id: 1,
        name: "Employee 1",
        email: "employee1@example.com",
        department: "Department 1",
        position: "Position 1",
        manager_id: null,
        manager_name: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });

    it("should return employee with manager details", async () => {
      const mockEmployee = {
        ...createMockEmployee(1),
        managerId: 2,
        manager: {
          id: 2,
          name: "Manager Name",
        },
      };
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(mockEmployee);

      const request = {} as NextRequest;
      const response = await GET(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.manager_id).toBe(2);
      expect(body.manager_name).toBe("Manager Name");
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
    });

    it("should handle database error", async () => {
      mockPrismaEmployee.findUnique.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = {} as NextRequest;
      const response = await GET(request, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });
});

describe("Employees API - PUT /api/employees/[id]", () => {
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

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "1" } });

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

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(403);
    });
  });

  describe("バリデーション", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
    });

    it("should return 400 for invalid employee ID", async () => {
      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "invalid" } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("INVALID_PARAMETER");
    });

    it("should return 404 when employee not found", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(null);

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "999" } });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("EMPLOYEE_NOT_FOUND");
    });

    it("should return 422 when name is missing", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(createMockEmployee(1));

      const request = createMockPutRequest({
        email: "updated@example.com",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "name",
          }),
        ])
      );
    });

    it("should return 422 when email is invalid", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(createMockEmployee(1));

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "invalid-email",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "1" } });

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

    it("should return 409 when email is taken by another employee", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        ...createMockEmployee(1),
        email: "original@example.com",
      });
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        id: 2,
        email: "taken@example.com",
      });

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "taken@example.com",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("should return 422 when manager does not exist", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(createMockEmployee(1));
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(null); // Manager check

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        department: "Sales",
        position: "Sales Rep",
        manager_id: 999,
      });
      const response = await PUT(request, { params: { id: "1" } });

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

    it("should allow password to be optional", async () => {
      const mockEmployee = createMockEmployee(1);
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(mockEmployee);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            update: vi.fn().mockResolvedValue(mockEmployee),
          },
          user: {
            findFirst: vi.fn().mockResolvedValue({ id: "user-1", employeeId: 1 }),
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
    });

    it("should validate password when provided", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(createMockEmployee(1));

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        password: "short",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "1" } });

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
  });

  describe("営業更新", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
      mockBcrypt.hash.mockResolvedValue("hashed_new_password");
    });

    it("should successfully update employee without password", async () => {
      const mockEmployee = createMockEmployee(1);
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(mockEmployee);

      const updatedEmployee = {
        ...mockEmployee,
        name: "Updated Employee",
        email: "updated@example.com",
      };

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            update: vi.fn().mockResolvedValue(updatedEmployee),
          },
          user: {
            findFirst: vi.fn().mockResolvedValue({ id: "user-1", employeeId: 1 }),
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        department: "Department 1",
        position: "Position 1",
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.name).toBe("Updated Employee");
      expect(body.email).toBe("updated@example.com");
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
    });

    it("should successfully update employee with password", async () => {
      const mockEmployee = createMockEmployee(1);
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(mockEmployee);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            update: vi.fn().mockResolvedValue(mockEmployee),
          },
          user: {
            findFirst: vi.fn().mockResolvedValue({ id: "user-1", employeeId: 1 }),
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const request = createMockPutRequest({
        name: "Employee 1",
        email: "employee1@example.com",
        password: "NewPassword123!",
        department: "Department 1",
        position: "Position 1",
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
      expect(mockBcrypt.hash).toHaveBeenCalledWith("NewPassword123!", 10);
    });

    it("should successfully update employee with manager", async () => {
      const mockEmployee = createMockEmployee(1);
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(mockEmployee);
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({ id: 2 }); // Manager check

      const updatedEmployee = {
        ...mockEmployee,
        managerId: 2,
        manager: { id: 2, name: "Manager Name" },
      };

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            update: vi.fn().mockResolvedValue(updatedEmployee),
          },
          user: {
            findFirst: vi.fn().mockResolvedValue({ id: "user-1", employeeId: 1 }),
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const request = createMockPutRequest({
        name: "Employee 1",
        email: "employee1@example.com",
        department: "Department 1",
        position: "Position 1",
        manager_id: 2,
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.manager_id).toBe(2);
      expect(body.manager_name).toBe("Manager Name");
    });

    it("should allow same email when not changing", async () => {
      const mockEmployee = createMockEmployee(1);
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(mockEmployee);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            update: vi.fn().mockResolvedValue(mockEmployee),
          },
          user: {
            findFirst: vi.fn().mockResolvedValue({ id: "user-1", employeeId: 1 }),
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const request = createMockPutRequest({
        name: "Employee 1",
        email: "employee1@example.com", // Same email
        department: "Department 1",
        position: "Position 1",
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
    });

    it("should handle employee with no associated user", async () => {
      const mockEmployee = createMockEmployee(1);
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(mockEmployee);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            update: vi.fn().mockResolvedValue(mockEmployee),
          },
          user: {
            findFirst: vi.fn().mockResolvedValue(null), // No user
            update: vi.fn(),
          },
        });
      });

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        department: "Department 1",
        position: "Position 1",
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
      mockPrismaEmployee.findUnique.mockResolvedValue(createMockEmployee(1));
    });

    it("should handle database error during transaction", async () => {
      mockPrismaTransaction.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("should handle unique constraint violation", async () => {
      const prismaError = new Error("Unique constraint failed") as any;
      prismaError.code = "P2002";
      mockPrismaTransaction.mockRejectedValueOnce(prismaError);

      const request = createMockPutRequest({
        name: "Updated Employee",
        email: "updated@example.com",
        department: "Sales",
        position: "Sales Rep",
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });
  });
});

describe("Employees API - DELETE /api/employees/[id]", () => {
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

      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "1" } });

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

      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(403);
    });
  });

  describe("営業削除", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
    });

    it("should return 400 for invalid employee ID", async () => {
      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "invalid" } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("INVALID_PARAMETER");
    });

    it("should return 404 when employee not found", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(null);

      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "999" } });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("EMPLOYEE_NOT_FOUND");
    });

    it("should return 409 when employee has daily reports", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        ...createMockEmployee(1),
        dailyReports: [{ id: 1 }],
        customers: [],
        comments: [],
        subordinates: [],
      });

      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error.code).toBe("EMPLOYEE_IN_USE");
      expect(body.error.message).toContain("日報や顧客で使用されている");
    });

    it("should return 409 when employee has customers", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        ...createMockEmployee(1),
        dailyReports: [],
        customers: [{ id: 1 }],
        comments: [],
        subordinates: [],
      });

      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error.code).toBe("EMPLOYEE_IN_USE");
    });

    it("should return 409 when employee has comments", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        ...createMockEmployee(1),
        dailyReports: [],
        customers: [],
        comments: [{ id: 1 }],
        subordinates: [],
      });

      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error.code).toBe("EMPLOYEE_IN_USE");
    });

    it("should return 409 when employee has subordinates", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        ...createMockEmployee(1),
        dailyReports: [],
        customers: [],
        comments: [],
        subordinates: [{ id: 2 }],
      });

      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error.code).toBe("EMPLOYEE_IN_USE");
    });

    it("should successfully delete employee with no dependencies", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        ...createMockEmployee(1),
        dailyReports: [],
        customers: [],
        comments: [],
        subordinates: [],
      });

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            delete: vi.fn().mockResolvedValue({}),
          },
          user: {
            findFirst: vi.fn().mockResolvedValue({ id: "user-1", employeeId: 1 }),
            delete: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(204);
    });

    it("should successfully delete employee with no associated user", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        ...createMockEmployee(1),
        dailyReports: [],
        customers: [],
        comments: [],
        subordinates: [],
      });

      mockPrismaTransaction.mockImplementation(async (callback) => {
        return callback({
          employee: {
            delete: vi.fn().mockResolvedValue({}),
          },
          user: {
            findFirst: vi.fn().mockResolvedValue(null), // No user
            delete: vi.fn(),
          },
        });
      });

      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(204);
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockAdminUser();
      mockRequireApiRole.mockResolvedValue({ user, error: null });
      mockPrismaEmployee.findUnique.mockResolvedValue({
        ...createMockEmployee(1),
        dailyReports: [],
        customers: [],
        comments: [],
        subordinates: [],
      });
    });

    it("should handle database error during transaction", async () => {
      mockPrismaTransaction.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = {} as NextRequest;
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });
});

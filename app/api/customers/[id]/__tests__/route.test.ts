/**
 * Tests for Customer API Routes - GET (detail), PUT (update), DELETE (delete)
 *
 * 顧客マスタAPI（詳細取得・更新・削除）エンドポイントの包括的なテスト
 *
 * @see ../route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "../route";

// Mock Prisma
const mockPrismaCustomer = {
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockPrismaEmployee = {
  findUnique: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: mockPrismaCustomer,
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
 * Helper function to create a mock request for GET/DELETE
 */
function createMockGetRequest(): NextRequest {
  return {} as NextRequest;
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
 * Helper function to create mock customer data
 */
function createMockCustomer(id: number) {
  return {
    id,
    customerName: `Customer ${id}`,
    address: `Address ${id}`,
    phone: `000-0000-${id}`,
    email: `customer${id}@example.com`,
    assignedEmployeeId: 1,
    assignedEmployee: {
      id: 1,
      name: "Sales Person",
    },
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

describe("Customers API - GET /api/customers/:id", () => {
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

      const request = createMockGetRequest();
      const response = await GET(request, { params: { id: "1" } });

      expect(response.status).toBe(401);
    });
  });

  describe("バリデーション", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
    });

    it("should return 400 for invalid customer ID", async () => {
      const request = createMockGetRequest();
      const response = await GET(request, { params: { id: "invalid" } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INVALID_PARAMETER",
          message: "無効な顧客IDです",
        },
      });
    });

    it("should return 404 when customer does not exist", async () => {
      mockPrismaCustomer.findUnique.mockResolvedValueOnce(null);

      const request = createMockGetRequest();
      const response = await GET(request, { params: { id: "999" } });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "CUSTOMER_NOT_FOUND",
          message: "顧客が見つかりません",
        },
      });
    });
  });

  describe("顧客詳細取得", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
    });

    it("should successfully retrieve customer details", async () => {
      const mockCustomer = createMockCustomer(1);
      mockPrismaCustomer.findUnique.mockResolvedValueOnce(mockCustomer);

      const request = createMockGetRequest();
      const response = await GET(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        customer_id: 1,
        customer_name: "Customer 1",
        address: "Address 1",
        phone: "000-0000-1",
        email: "customer1@example.com",
        assigned_employee_id: 1,
        assigned_employee_name: "Sales Person",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
    });

    it("should handle database error", async () => {
      mockPrismaCustomer.findUnique.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockGetRequest();
      const response = await GET(request, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "顧客情報の取得中にエラーが発生しました",
        },
      });
    });
  });
});

describe("Customers API - PUT /api/customers/:id", () => {
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

      const request = createMockPutRequest({
        customer_name: "Updated Customer",
        assigned_employee_id: 1,
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(401);
    });
  });

  describe("バリデーション", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
    });

    it("should return 400 for invalid customer ID", async () => {
      const request = createMockPutRequest({
        customer_name: "Updated Customer",
        assigned_employee_id: 1,
      });
      const response = await PUT(request, { params: { id: "invalid" } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INVALID_PARAMETER",
          message: "無効な顧客IDです",
        },
      });
    });

    it("should return 404 when customer does not exist", async () => {
      mockPrismaCustomer.findUnique.mockResolvedValueOnce(null);

      const request = createMockPutRequest({
        customer_name: "Updated Customer",
        assigned_employee_id: 1,
      });
      const response = await PUT(request, { params: { id: "999" } });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "CUSTOMER_NOT_FOUND",
          message: "顧客が見つかりません",
        },
      });
    });

    it("should return 422 when customer_name is missing", async () => {
      mockPrismaCustomer.findUnique.mockResolvedValueOnce(createMockCustomer(1));

      const request = createMockPutRequest({
        assigned_employee_id: 1,
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 422 when assigned employee does not exist", async () => {
      mockPrismaCustomer.findUnique.mockResolvedValueOnce(createMockCustomer(1));
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(null);

      const request = createMockPutRequest({
        customer_name: "Updated Customer",
        assigned_employee_id: 999,
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "assigned_employee_id",
            message: "指定された担当営業が見つかりません",
          }),
        ])
      );
    });

    it("should transform empty string to null for optional fields", async () => {
      mockPrismaCustomer.findUnique.mockResolvedValueOnce(createMockCustomer(1));
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        id: 1,
        name: "Sales Person",
      });
      mockPrismaCustomer.update.mockResolvedValueOnce({
        ...createMockCustomer(1),
        address: null,
        phone: null,
        email: null,
      });

      const request = createMockPutRequest({
        customer_name: "Updated Customer",
        address: "",
        phone: "",
        email: "",
        assigned_employee_id: 1,
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
      expect(mockPrismaCustomer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            address: null,
            phone: null,
            email: null,
          }),
        })
      );
    });
  });

  describe("顧客更新", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
      mockPrismaCustomer.findUnique.mockResolvedValue(createMockCustomer(1));
      mockPrismaEmployee.findUnique.mockResolvedValue({
        id: 1,
        name: "Sales Person",
      });
    });

    it("should successfully update a customer", async () => {
      const updatedCustomer = {
        ...createMockCustomer(1),
        customerName: "Updated Customer",
        address: "Updated Address",
      };
      mockPrismaCustomer.update.mockResolvedValueOnce(updatedCustomer);

      const request = createMockPutRequest({
        customer_name: "Updated Customer",
        address: "Updated Address",
        phone: "000-0000-1",
        email: "customer1@example.com",
        assigned_employee_id: 1,
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.customer_name).toBe("Updated Customer");
      expect(body.address).toBe("Updated Address");
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
      mockPrismaCustomer.findUnique.mockResolvedValue(createMockCustomer(1));
      mockPrismaEmployee.findUnique.mockResolvedValue({
        id: 1,
        name: "Sales Person",
      });
    });

    it("should handle database error during update", async () => {
      mockPrismaCustomer.update.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockPutRequest({
        customer_name: "Updated Customer",
        assigned_employee_id: 1,
      });
      const response = await PUT(request, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "顧客の更新中にエラーが発生しました",
        },
      });
    });
  });
});

describe("Customers API - DELETE /api/customers/:id", () => {
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

      const request = createMockGetRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(401);
    });
  });

  describe("バリデーション", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
    });

    it("should return 400 for invalid customer ID", async () => {
      const request = createMockGetRequest();
      const response = await DELETE(request, { params: { id: "invalid" } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INVALID_PARAMETER",
          message: "無効な顧客IDです",
        },
      });
    });

    it("should return 404 when customer does not exist", async () => {
      mockPrismaCustomer.findUnique.mockResolvedValueOnce(null);

      const request = createMockGetRequest();
      const response = await DELETE(request, { params: { id: "999" } });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "CUSTOMER_NOT_FOUND",
          message: "顧客が見つかりません",
        },
      });
    });
  });

  describe("顧客削除", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
    });

    it("should successfully delete a customer", async () => {
      mockPrismaCustomer.findUnique.mockResolvedValueOnce({
        ...createMockCustomer(1),
        visitRecords: [],
      });
      mockPrismaCustomer.delete.mockResolvedValueOnce(createMockCustomer(1));

      const request = createMockGetRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(204);
      expect(mockPrismaCustomer.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return 409 when customer is used in visit records", async () => {
      mockPrismaCustomer.findUnique.mockResolvedValueOnce({
        ...createMockCustomer(1),
        visitRecords: [{ id: 1 }],
      });

      const request = createMockGetRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "CUSTOMER_IN_USE",
          message: "この顧客は訪問記録で使用されているため削除できません",
        },
      });
      expect(mockPrismaCustomer.delete).not.toHaveBeenCalled();
    });

    it("should return 204 No Content with no response body", async () => {
      mockPrismaCustomer.findUnique.mockResolvedValueOnce({
        ...createMockCustomer(1),
        visitRecords: [],
      });
      mockPrismaCustomer.delete.mockResolvedValueOnce(createMockCustomer(1));

      const request = createMockGetRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(204);
      const text = await response.text();
      expect(text).toBe("");
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
      mockPrismaCustomer.findUnique.mockResolvedValue({
        ...createMockCustomer(1),
        visitRecords: [],
      });
    });

    it("should handle database error during delete", async () => {
      mockPrismaCustomer.delete.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockGetRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "顧客の削除中にエラーが発生しました",
        },
      });
    });
  });
});

/**
 * Tests for Customer API Routes - GET (list) and POST (create)
 *
 * 顧客マスタAPI（一覧取得・作成）エンドポイントの包括的なテスト
 *
 * @see ../route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";

// Mock Prisma
const mockPrismaCustomer = {
  count: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
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
 * Helper function to create a mock request for GET
 */
function createMockGetRequest(searchParams?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/customers");
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

describe("Customers API - GET /api/customers", () => {
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
      mockPrismaCustomer.count.mockResolvedValueOnce(0);
      mockPrismaCustomer.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should allow authenticated managers", async () => {
      const user = createMockUser("上長", 2);
      mockRequireApiAuth.mockResolvedValueOnce({ user, error: null });
      mockPrismaCustomer.count.mockResolvedValueOnce(0);
      mockPrismaCustomer.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should allow authenticated admins", async () => {
      const user = createMockUser("管理者", 3);
      mockRequireApiAuth.mockResolvedValueOnce({ user, error: null });
      mockPrismaCustomer.count.mockResolvedValueOnce(0);
      mockPrismaCustomer.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("顧客一覧取得", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
    });

    it("should return empty list when no customers", async () => {
      mockPrismaCustomer.count.mockResolvedValueOnce(0);
      mockPrismaCustomer.findMany.mockResolvedValueOnce([]);

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
          limit: 100,
        },
      });
    });

    it("should return customer list with default pagination", async () => {
      const mockCustomers = [createMockCustomer(1), createMockCustomer(2)];
      mockPrismaCustomer.count.mockResolvedValueOnce(2);
      mockPrismaCustomer.findMany.mockResolvedValueOnce(mockCustomers);

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(2);
      expect(body.meta).toEqual({
        current_page: 1,
        total_pages: 1,
        total_count: 2,
        limit: 100,
      });
    });

    it("should handle custom page parameter", async () => {
      mockPrismaCustomer.count.mockResolvedValueOnce(150);
      mockPrismaCustomer.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest({ page: "2" });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.meta.current_page).toBe(2);
      expect(body.meta.total_pages).toBe(2);
      expect(mockPrismaCustomer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 100, take: 100 })
      );
    });

    it("should handle custom limit parameter", async () => {
      mockPrismaCustomer.count.mockResolvedValueOnce(50);
      mockPrismaCustomer.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest({ limit: "20" });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.meta.limit).toBe(20);
      expect(mockPrismaCustomer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 })
      );
    });

    it("should cap limit at 500", async () => {
      mockPrismaCustomer.count.mockResolvedValueOnce(1000);
      mockPrismaCustomer.findMany.mockResolvedValueOnce([]);

      const request = createMockGetRequest({ limit: "1000" });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.meta.limit).toBe(500);
    });

    it("should format customer data correctly", async () => {
      const mockCustomer = createMockCustomer(1);
      mockPrismaCustomer.count.mockResolvedValueOnce(1);
      mockPrismaCustomer.findMany.mockResolvedValueOnce([mockCustomer]);

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data[0]).toEqual({
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

    it("should handle database error during count", async () => {
      mockPrismaCustomer.count.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "顧客情報の取得中にエラーが発生しました",
        },
      });
    });

    it("should handle database error during findMany", async () => {
      mockPrismaCustomer.count.mockResolvedValueOnce(10);
      mockPrismaCustomer.findMany.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});

describe("Customers API - POST /api/customers", () => {
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

      const request = createMockPostRequest({
        customer_name: "Test Customer",
        assigned_employee_id: 1,
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe("バリデーション", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
    });

    it("should return 422 when customer_name is missing", async () => {
      const request = createMockPostRequest({
        assigned_employee_id: 1,
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "customer_name",
          }),
        ])
      );
    });

    it("should return 422 when customer_name exceeds 100 characters", async () => {
      const longName = "a".repeat(101);
      const request = createMockPostRequest({
        customer_name: longName,
        assigned_employee_id: 1,
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "customer_name",
            message: expect.stringContaining("100文字以内"),
          }),
        ])
      );
    });

    it("should return 422 when assigned_employee_id is missing", async () => {
      const request = createMockPostRequest({
        customer_name: "Test Customer",
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "assigned_employee_id",
          }),
        ])
      );
    });

    it("should return 422 when email is invalid", async () => {
      const request = createMockPostRequest({
        customer_name: "Test Customer",
        email: "invalid-email",
        assigned_employee_id: 1,
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

    it("should return 422 when phone contains invalid characters", async () => {
      const request = createMockPostRequest({
        customer_name: "Test Customer",
        phone: "03-1234-ABCD",
        assigned_employee_id: 1,
      });
      const response = await POST(request);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "phone",
            message: expect.stringContaining("数字とハイフン"),
          }),
        ])
      );
    });

    it("should return 422 when assigned employee does not exist", async () => {
      mockPrismaEmployee.findUnique.mockResolvedValueOnce(null);

      const request = createMockPostRequest({
        customer_name: "Test Customer",
        assigned_employee_id: 999,
      });
      const response = await POST(request);

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
      mockPrismaEmployee.findUnique.mockResolvedValueOnce({
        id: 1,
        name: "Sales Person",
      });
      mockPrismaCustomer.create.mockResolvedValueOnce({
        ...createMockCustomer(1),
        address: null,
        phone: null,
        email: null,
      });

      const request = createMockPostRequest({
        customer_name: "Test Customer",
        address: "",
        phone: "",
        email: "",
        assigned_employee_id: 1,
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockPrismaCustomer.create).toHaveBeenCalledWith(
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

  describe("顧客作成", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
      mockPrismaEmployee.findUnique.mockResolvedValue({
        id: 1,
        name: "Sales Person",
      });
    });

    it("should successfully create a customer with all fields", async () => {
      const mockCustomer = createMockCustomer(1);
      mockPrismaCustomer.create.mockResolvedValueOnce(mockCustomer);

      const request = createMockPostRequest({
        customer_name: "Customer 1",
        address: "Address 1",
        phone: "000-0000-1",
        email: "customer1@example.com",
        assigned_employee_id: 1,
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
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

    it("should successfully create a customer with only required fields", async () => {
      const mockCustomer = {
        ...createMockCustomer(1),
        address: null,
        phone: null,
        email: null,
      };
      mockPrismaCustomer.create.mockResolvedValueOnce(mockCustomer);

      const request = createMockPostRequest({
        customer_name: "Customer 1",
        assigned_employee_id: 1,
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.address).toBeNull();
      expect(body.phone).toBeNull();
      expect(body.email).toBeNull();
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockUser();
      mockRequireApiAuth.mockResolvedValue({ user, error: null });
      mockPrismaEmployee.findUnique.mockResolvedValue({
        id: 1,
        name: "Sales Person",
      });
    });

    it("should handle database error during create", async () => {
      mockPrismaCustomer.create.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockPostRequest({
        customer_name: "Test Customer",
        assigned_employee_id: 1,
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "顧客の作成中にエラーが発生しました",
        },
      });
    });
  });
});

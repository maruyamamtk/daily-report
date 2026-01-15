/**
 * Tests for Comment DELETE API Route
 *
 * コメント削除APIエンドポイントの包括的なテスト
 *
 * @see ../route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { DELETE } from "../route";
import type { Session } from "next-auth";

// Mock Prisma
const mockPrismaComment = {
  findUnique: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comment: mockPrismaComment,
  },
}));

// Mock requireApiAuthWithEmployeeId
const mockRequireApiAuthWithEmployeeId = vi.fn();
vi.mock("@/lib/api-auth", () => ({
  requireApiAuthWithEmployeeId: mockRequireApiAuthWithEmployeeId,
}));

/**
 * Helper function to create a mock user
 */
function createMockUser(employeeId: number = 2) {
  return {
    id: "test-user-id",
    email: "user@example.com",
    name: "Test User",
    role: "MANAGER",
    employeeId,
    managerId: null,
  };
}

/**
 * Helper function to create a mock request (not used for DELETE but kept for consistency)
 */
function createMockRequest(): NextRequest {
  return {
    json: async () => ({}),
  } as NextRequest;
}

describe("Comments API - DELETE /api/comments/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("認証・認可", () => {
    it("should return 401 when not authenticated", async () => {
      mockRequireApiAuthWithEmployeeId.mockResolvedValueOnce({
        error: new Response(
          JSON.stringify({
            error: { code: "UNAUTHORIZED", message: "認証が必要です" },
          }),
          { status: 401 }
        ),
        user: null,
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({
        error: { code: "UNAUTHORIZED", message: "認証が必要です" },
      });
    });

    it("should return 400 when user has null employeeId", async () => {
      mockRequireApiAuthWithEmployeeId.mockResolvedValueOnce({
        error: new Response(
          JSON.stringify({
            error: {
              code: "INVALID_USER",
              message: "ユーザー情報が不正です",
            },
          }),
          { status: 400 }
        ),
        user: null,
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INVALID_USER",
          message: "ユーザー情報が不正です",
        },
      });
    });

    it("should return 403 when trying to delete someone else's comment", async () => {
      const user = createMockUser(2);
      mockRequireApiAuthWithEmployeeId.mockResolvedValueOnce({
        user,
        error: null,
      });

      // Comment belongs to a different user (employeeId: 3)
      mockPrismaComment.findUnique.mockResolvedValueOnce({
        id: 1,
        commenterId: 3, // Different user
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "このコメントを削除する権限がありません",
        },
      });

      // Should not attempt to delete
      expect(mockPrismaComment.delete).not.toHaveBeenCalled();
    });

    it("should successfully delete own comment", async () => {
      const user = createMockUser(2);
      mockRequireApiAuthWithEmployeeId.mockResolvedValueOnce({
        user,
        error: null,
      });

      // Comment belongs to the same user (employeeId: 2)
      mockPrismaComment.findUnique.mockResolvedValueOnce({
        id: 1,
        commenterId: 2, // Same user
      });

      mockPrismaComment.delete.mockResolvedValueOnce({
        id: 1,
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(204);

      // Should attempt to delete
      expect(mockPrismaComment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe("バリデーション", () => {
    beforeEach(() => {
      const user = createMockUser(2);
      mockRequireApiAuthWithEmployeeId.mockResolvedValue({
        user,
        error: null,
      });
    });

    it("should return 400 for invalid comment ID (string)", async () => {
      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "invalid" } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "無効なコメントIDです",
        },
      });

      // Should not attempt to find or delete
      expect(mockPrismaComment.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaComment.delete).not.toHaveBeenCalled();
    });

    it("should return 404 when comment does not exist", async () => {
      mockPrismaComment.findUnique.mockResolvedValueOnce(null);

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "999" } });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "COMMENT_NOT_FOUND",
          message: "コメントが見つかりません",
        },
      });

      // Should not attempt to delete
      expect(mockPrismaComment.delete).not.toHaveBeenCalled();
    });

    it("should handle zero as comment ID", async () => {
      mockPrismaComment.findUnique.mockResolvedValueOnce(null);

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "0" } });

      // 0 is a valid number but likely won't exist
      expect(mockPrismaComment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 0 },
        })
      );
    });

    it("should handle negative number as comment ID", async () => {
      mockPrismaComment.findUnique.mockResolvedValueOnce(null);

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "-1" } });

      // -1 is a valid number but likely won't exist
      expect(mockPrismaComment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: -1 },
        })
      );
    });

    it("should handle large comment ID", async () => {
      const largeId = 999999999;
      mockPrismaComment.findUnique.mockResolvedValueOnce({
        id: largeId,
        commenterId: 2,
      });

      mockPrismaComment.delete.mockResolvedValueOnce({
        id: largeId,
      });

      const request = createMockRequest();
      const response = await DELETE(request, {
        params: { id: largeId.toString() },
      });

      expect(response.status).toBe(204);
    });
  });

  describe("コメント削除", () => {
    beforeEach(() => {
      const user = createMockUser(2);
      mockRequireApiAuthWithEmployeeId.mockResolvedValue({
        user,
        error: null,
      });
    });

    it("should successfully delete a comment", async () => {
      mockPrismaComment.findUnique.mockResolvedValueOnce({
        id: 1,
        commenterId: 2,
      });

      mockPrismaComment.delete.mockResolvedValueOnce({
        id: 1,
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(204);

      expect(mockPrismaComment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          commenterId: true,
        },
      });

      expect(mockPrismaComment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return 204 No Content with no response body", async () => {
      mockPrismaComment.findUnique.mockResolvedValueOnce({
        id: 1,
        commenterId: 2,
      });

      mockPrismaComment.delete.mockResolvedValueOnce({
        id: 1,
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(204);

      // Response body should be null/empty
      const text = await response.text();
      expect(text).toBe("");
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const user = createMockUser(2);
      mockRequireApiAuthWithEmployeeId.mockResolvedValue({
        user,
        error: null,
      });

      mockPrismaComment.findUnique.mockResolvedValue({
        id: 1,
        commenterId: 2,
      });
    });

    it("should handle database error during findUnique", async () => {
      mockPrismaComment.findUnique.mockRejectedValueOnce(
        new Error("Database connection error")
      );

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "コメントの削除中にエラーが発生しました",
        },
      });
    });

    it("should handle database error during delete", async () => {
      mockPrismaComment.delete.mockRejectedValueOnce(
        new Error("Database error")
      );

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "コメントの削除中にエラーが発生しました",
        },
      });
    });

    it("should handle unexpected errors", async () => {
      mockPrismaComment.findUnique.mockImplementationOnce(() => {
        throw new Error("Unexpected error");
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  describe("権限チェック詳細", () => {
    it("should allow user to delete their own comment (employeeId: 1)", async () => {
      const user = createMockUser(1);
      mockRequireApiAuthWithEmployeeId.mockResolvedValueOnce({
        user,
        error: null,
      });

      mockPrismaComment.findUnique.mockResolvedValueOnce({
        id: 1,
        commenterId: 1,
      });

      mockPrismaComment.delete.mockResolvedValueOnce({
        id: 1,
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(204);
    });

    it("should allow user to delete their own comment (employeeId: 999)", async () => {
      const user = createMockUser(999);
      mockRequireApiAuthWithEmployeeId.mockResolvedValueOnce({
        user,
        error: null,
      });

      mockPrismaComment.findUnique.mockResolvedValueOnce({
        id: 1,
        commenterId: 999,
      });

      mockPrismaComment.delete.mockResolvedValueOnce({
        id: 1,
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(204);
    });

    it("should prevent user from deleting comment by user 1 when they are user 2", async () => {
      const user = createMockUser(2);
      mockRequireApiAuthWithEmployeeId.mockResolvedValueOnce({
        user,
        error: null,
      });

      mockPrismaComment.findUnique.mockResolvedValueOnce({
        id: 1,
        commenterId: 1, // Different user
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      expect(response.status).toBe(403);
      expect(mockPrismaComment.delete).not.toHaveBeenCalled();
    });
  });

  describe("レスポンスフォーマット", () => {
    beforeEach(() => {
      const user = createMockUser(2);
      mockRequireApiAuthWithEmployeeId.mockResolvedValue({
        user,
        error: null,
      });
    });

    it("should return proper Content-Type for error responses", async () => {
      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "invalid" } });

      expect(response.headers.get("content-type")).toContain(
        "application/json"
      );
    });

    it("should return consistent error format for validation errors", async () => {
      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "invalid" } });

      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(body.error).toHaveProperty("code");
      expect(body.error).toHaveProperty("message");
    });

    it("should return consistent error format for not found errors", async () => {
      mockPrismaComment.findUnique.mockResolvedValueOnce(null);

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "999" } });

      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(body.error).toHaveProperty("code");
      expect(body.error).toHaveProperty("message");
      expect(body.error.code).toBe("COMMENT_NOT_FOUND");
    });

    it("should return consistent error format for forbidden errors", async () => {
      mockPrismaComment.findUnique.mockResolvedValueOnce({
        id: 1,
        commenterId: 3,
      });

      const request = createMockRequest();
      const response = await DELETE(request, { params: { id: "1" } });

      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(body.error).toHaveProperty("code");
      expect(body.error).toHaveProperty("message");
      expect(body.error.code).toBe("FORBIDDEN");
    });
  });
});

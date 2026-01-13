/**
 * Tests for Comments API Routes
 *
 * コメントAPIエンドポイントの包括的なテスト
 *
 * @see ../route.ts
 */

import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { UserRole } from "@/types/roles";
import type { Session } from "next-auth";

// Mock Prisma
const mockPrismaComment = {
  create: vi.fn(),
};

const mockPrismaDailyReport = {
  findUnique: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comment: mockPrismaComment,
    dailyReport: mockPrismaDailyReport,
  },
}));

// Mock requireApiAuth
const mockRequireApiAuth = vi.fn();
vi.mock("@/lib/api-auth", () => ({
  requireApiAuth: mockRequireApiAuth,
}));

/**
 * Helper function to create a mock session
 */
function createMockSession(
  role: string = UserRole.MANAGER,
  employeeId: number = 2
): Session {
  return {
    user: {
      id: "test-user-id",
      email: "manager@example.com",
      name: "Manager User",
      role,
      employeeId,
      managerId: null,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

/**
 * Helper function to create a mock request
 */
function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
  } as NextRequest;
}

describe("Comments API - POST /api/daily-reports/:id/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("認証・認可", () => {
    it("should return 401 when not authenticated", async () => {
      mockRequireApiAuth.mockResolvedValueOnce({
        error: new Response(JSON.stringify({ error: "認証が必要です" }), { status: 401 }),
      });

      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "認証が必要です" });
    });

    it("should return 403 when user is SALES role", async () => {
      const salesSession = createMockSession(UserRole.SALES, 1);
      mockRequireApiAuth.mockResolvedValueOnce({
        user: salesSession.user,
      });

      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "コメントを投稿する権限がありません",
        },
      });
    });

    it("should allow MANAGER to post comment", async () => {
      const managerSession = createMockSession(UserRole.MANAGER, 2);
      mockRequireApiAuth.mockResolvedValueOnce({
        user: managerSession.user,
      });

      mockPrismaDailyReport.findUnique.mockResolvedValueOnce({
        id: 1,
        employeeId: 1,
        employee: {
          managerId: 2,
        },
      });

      mockPrismaComment.create.mockResolvedValueOnce({
        id: 1,
        reportId: 1,
        commenterId: 2,
        commentContent: "テストコメント",
        createdAt: new Date("2026-01-10T10:00:00Z"),
        commenter: {
          id: 2,
          name: "Manager User",
        },
      });

      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(201);
    });

    it("should return 403 when MANAGER tries to comment on report they don't manage", async () => {
      const managerSession = createMockSession(UserRole.MANAGER, 2);
      mockRequireApiAuth.mockResolvedValueOnce({
        user: managerSession.user,
      });

      // Report's employee has a different manager (managerId: 3, not 2)
      mockPrismaDailyReport.findUnique.mockResolvedValueOnce({
        id: 1,
        employeeId: 1,
        employee: {
          managerId: 3, // Different manager
        },
      });

      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "この日報にコメントする権限がありません",
        },
      });
    });

    it("should allow ADMIN to post comment", async () => {
      const adminSession = createMockSession(UserRole.ADMIN, 3);
      mockRequireApiAuth.mockResolvedValueOnce({
        user: adminSession.user,
      });

      mockPrismaDailyReport.findUnique.mockResolvedValueOnce({
        id: 1,
        employeeId: 1,
        employee: {
          managerId: 2,
        },
      });

      mockPrismaComment.create.mockResolvedValueOnce({
        id: 1,
        reportId: 1,
        commenterId: 3,
        commentContent: "テストコメント",
        createdAt: new Date("2026-01-10T10:00:00Z"),
        commenter: {
          id: 3,
          name: "Admin User",
        },
      });

      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(201);
    });
  });

  describe("バリデーション", () => {
    beforeEach(() => {
      const managerSession = createMockSession(UserRole.MANAGER, 2);
      mockRequireApiAuth.mockResolvedValue({
        user: managerSession.user,
      });

      mockPrismaDailyReport.findUnique.mockResolvedValue({
        id: 1,
        employeeId: 1,
        employee: {
          managerId: 2,
        },
      });
    });

    it("should return 400 for invalid report ID", async () => {
      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "invalid" } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "無効な日報IDです",
        },
      });
    });

    it("should return 422 when comment_content is empty", async () => {
      const request = createMockRequest({ comment_content: "" });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("入力内容に誤りがあります");
      expect(body.error.details).toEqual([
        {
          field: "comment_content",
          message: "コメント内容は必須です",
        },
      ]);
    });

    it("should return 422 when comment_content exceeds 500 characters", async () => {
      const longComment = "あ".repeat(501);
      const request = createMockRequest({ comment_content: longComment });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual([
        {
          field: "comment_content",
          message: "コメント内容は500文字以内で入力してください",
        },
      ]);
    });

    it("should accept comment with exactly 500 characters", async () => {
      const maxLengthComment = "あ".repeat(500);
      const request = createMockRequest({ comment_content: maxLengthComment });

      mockPrismaComment.create.mockResolvedValueOnce({
        id: 1,
        reportId: 1,
        commenterId: 2,
        commentContent: maxLengthComment,
        createdAt: new Date("2026-01-10T10:00:00Z"),
        commenter: {
          id: 2,
          name: "Manager User",
        },
      });

      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(201);
    });

    it("should return 404 when report does not exist", async () => {
      mockPrismaDailyReport.findUnique.mockResolvedValueOnce(null);

      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "999" } });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "REPORT_NOT_FOUND",
          message: "日報が見つかりません",
        },
      });
    });
  });

  describe("コメント作成", () => {
    beforeEach(() => {
      const managerSession = createMockSession(UserRole.MANAGER, 2);
      mockRequireApiAuth.mockResolvedValue({
        user: managerSession.user,
      });

      mockPrismaDailyReport.findUnique.mockResolvedValue({
        id: 1,
        employeeId: 1,
        employee: {
          managerId: 2,
        },
      });
    });

    it("should successfully create a comment", async () => {
      const commentData = {
        id: 1,
        reportId: 1,
        commenterId: 2,
        commentContent: "良い内容ですね！",
        createdAt: new Date("2026-01-10T10:00:00Z"),
        commenter: {
          id: 2,
          name: "Manager User",
        },
      };

      mockPrismaComment.create.mockResolvedValueOnce(commentData);

      const request = createMockRequest({ comment_content: "良い内容ですね！" });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        comment_id: 1,
        report_id: 1,
        commenter_id: 2,
        commenter_name: "Manager User",
        comment_content: "良い内容ですね！",
        created_at: "2026-01-10T10:00:00.000Z",
      });

      expect(mockPrismaComment.create).toHaveBeenCalledWith({
        data: {
          reportId: 1,
          commenterId: 2,
          commentContent: "良い内容ですね！",
        },
        include: {
          commenter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    it("should handle whitespace in comment content", async () => {
      const commentData = {
        id: 1,
        reportId: 1,
        commenterId: 2,
        commentContent: "  テストコメント  ",
        createdAt: new Date("2026-01-10T10:00:00Z"),
        commenter: {
          id: 2,
          name: "Manager User",
        },
      };

      mockPrismaComment.create.mockResolvedValueOnce(commentData);

      const request = createMockRequest({ comment_content: "  テストコメント  " });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(201);
    });

    it("should handle multiline comment content", async () => {
      const multilineComment = "1行目\n2行目\n3行目";
      const commentData = {
        id: 1,
        reportId: 1,
        commenterId: 2,
        commentContent: multilineComment,
        createdAt: new Date("2026-01-10T10:00:00Z"),
        commenter: {
          id: 2,
          name: "Manager User",
        },
      };

      mockPrismaComment.create.mockResolvedValueOnce(commentData);

      const request = createMockRequest({ comment_content: multilineComment });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.comment_content).toBe(multilineComment);
    });

    it("should handle Japanese characters", async () => {
      const japaneseComment = "これは日本語のコメントです。良い内容ですね！";
      const commentData = {
        id: 1,
        reportId: 1,
        commenterId: 2,
        commentContent: japaneseComment,
        createdAt: new Date("2026-01-10T10:00:00Z"),
        commenter: {
          id: 2,
          name: "Manager User",
        },
      };

      mockPrismaComment.create.mockResolvedValueOnce(commentData);

      const request = createMockRequest({ comment_content: japaneseComment });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.comment_content).toBe(japaneseComment);
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      const managerSession = createMockSession(UserRole.MANAGER, 2);
      mockRequireApiAuth.mockResolvedValue({
        user: managerSession.user,
      });

      mockPrismaDailyReport.findUnique.mockResolvedValue({
        id: 1,
        employeeId: 1,
        employee: {
          managerId: 2,
        },
      });
    });

    it("should handle database error", async () => {
      mockPrismaComment.create.mockRejectedValueOnce(new Error("Database error"));

      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "コメントの投稿中にエラーが発生しました",
        },
      });
    });

    it("should handle malformed JSON request", async () => {
      const malformedRequest = {
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as NextRequest;

      const response = await POST(malformedRequest, { params: { id: "1" } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("should handle missing request body", async () => {
      const request = createMockRequest({});
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should handle null comment_content", async () => {
      const request = createMockRequest({ comment_content: null });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should handle undefined comment_content", async () => {
      const request = createMockRequest({ comment_content: undefined });
      const response = await POST(request, { params: { id: "1" } });

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("レスポンスフォーマット", () => {
    beforeEach(() => {
      const managerSession = createMockSession(UserRole.MANAGER, 2);
      mockRequireApiAuth.mockResolvedValue({
        user: managerSession.user,
      });

      mockPrismaDailyReport.findUnique.mockResolvedValue({
        id: 1,
        employeeId: 1,
        employee: {
          managerId: 2,
        },
      });
    });

    it("should return correct response format", async () => {
      const commentData = {
        id: 123,
        reportId: 456,
        commenterId: 2,
        commentContent: "テストコメント",
        createdAt: new Date("2026-01-10T15:30:45.123Z"),
        commenter: {
          id: 2,
          name: "山田太郎",
        },
      };

      mockPrismaComment.create.mockResolvedValueOnce(commentData);

      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "456" } });

      expect(response.status).toBe(201);
      const body = await response.json();

      expect(body).toHaveProperty("comment_id");
      expect(body).toHaveProperty("report_id");
      expect(body).toHaveProperty("commenter_id");
      expect(body).toHaveProperty("commenter_name");
      expect(body).toHaveProperty("comment_content");
      expect(body).toHaveProperty("created_at");

      expect(body.comment_id).toBe(123);
      expect(body.report_id).toBe(456);
      expect(body.commenter_id).toBe(2);
      expect(body.commenter_name).toBe("山田太郎");
      expect(body.comment_content).toBe("テストコメント");
      expect(body.created_at).toBe("2026-01-10T15:30:45.123Z");
    });

    it("should return ISO 8601 formatted date", async () => {
      const commentData = {
        id: 1,
        reportId: 1,
        commenterId: 2,
        commentContent: "テストコメント",
        createdAt: new Date("2026-01-10T10:00:00Z"),
        commenter: {
          id: 2,
          name: "Manager User",
        },
      };

      mockPrismaComment.create.mockResolvedValueOnce(commentData);

      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "1" } });

      const body = await response.json();
      expect(body.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe("パラメータハンドリング", () => {
    beforeEach(() => {
      const managerSession = createMockSession(UserRole.MANAGER, 2);
      mockRequireApiAuth.mockResolvedValue({
        user: managerSession.user,
      });
    });

    it("should handle large report ID", async () => {
      const largeId = 999999999;
      mockPrismaDailyReport.findUnique.mockResolvedValueOnce({
        id: largeId,
        employeeId: 1,
        employee: {
          managerId: 2,
        },
      });

      mockPrismaComment.create.mockResolvedValueOnce({
        id: 1,
        reportId: largeId,
        commenterId: 2,
        commentContent: "テストコメント",
        createdAt: new Date(),
        commenter: {
          id: 2,
          name: "Manager User",
        },
      });

      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: largeId.toString() } });

      expect(response.status).toBe(201);
    });

    it("should handle zero as report ID", async () => {
      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "0" } });

      // 0 is a valid number but likely won't exist
      expect(mockPrismaDailyReport.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 0 },
        })
      );
    });

    it("should handle negative number as report ID", async () => {
      const request = createMockRequest({ comment_content: "テストコメント" });
      const response = await POST(request, { params: { id: "-1" } });

      // -1 is a valid number but likely won't exist
      expect(mockPrismaDailyReport.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: -1 },
        })
      );
    });
  });
});

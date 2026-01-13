/**
 * Daily Report Comments API Routes
 *
 * Handles posting comments to daily reports.
 * Only managers and admins can post comments.
 *
 * @see api-specification.md - コメントAPIセクション
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";
import { z } from "zod";
import { UserRole } from "@/types/roles";

const commentSchema = z.object({
  comment_content: z
    .string()
    .min(1, "コメント内容は必須です")
    .max(500, "コメント内容は500文字以内で入力してください"),
});

/**
 * POST /api/daily-reports/:id/comments
 *
 * Post a comment to a daily report.
 *
 * Request body:
 * {
 *   comment_content: string (max 500 chars)
 * }
 *
 * Permissions:
 * - Only managers and admins can post comments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "無効な日報IDです" } },
        { status: 400 }
      );
    }

    // Check authentication
    const authResult = await requireApiAuth();
    if (authResult.error) return authResult.error;

    const { user } = authResult;

    // Check permission (only managers and admins can comment)
    if (user.role !== UserRole.MANAGER && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "コメントを投稿する権限がありません",
          },
        },
        { status: 403 }
      );
    }

    // Check if report exists
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        employee: {
          select: {
            managerId: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: { code: "REPORT_NOT_FOUND", message: "日報が見つかりません" } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = commentSchema.safeParse(body);

    if (!validation.success) {
      const details = validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "入力内容に誤りがあります",
            details,
          },
        },
        { status: 422 }
      );
    }

    const { comment_content } = validation.data;

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        reportId: reportId,
        commenterId: user.employeeId!,
        commentContent: comment_content,
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

    // Format response
    const response = {
      comment_id: comment.id,
      report_id: comment.reportId,
      commenter_id: comment.commenterId,
      commenter_name: comment.commenter.name,
      comment_content: comment.commentContent,
      created_at: comment.createdAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "コメントの投稿中にエラーが発生しました",
        },
      },
      { status: 500 }
    );
  }
}

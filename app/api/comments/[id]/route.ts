/**
 * Comment API Routes - DELETE by ID
 *
 * Handles deleting a specific comment.
 * Users can only delete their own comments.
 *
 * @see api-specification.md - コメントAPIセクション
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

/**
 * DELETE /api/comments/:id
 *
 * Delete a comment.
 *
 * Permissions:
 * - Users can only delete their own comments
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = parseInt(params.id);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "無効なコメントIDです" } },
        { status: 400 }
      );
    }

    // Check authentication
    const authResult = await requireApiAuth();
    if (authResult.error) return authResult.error;

    const { user } = authResult;

    // Check if user has a valid employeeId
    if (!user.employeeId) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_USER",
            message: "ユーザー情報が不正です",
          },
        },
        { status: 400 }
      );
    }

    // Fetch existing comment
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        commenterId: true,
      },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: { code: "COMMENT_NOT_FOUND", message: "コメントが見つかりません" } },
        { status: 404 }
      );
    }

    // Check if user is the commenter (only own comments can be deleted)
    if (existingComment.commenterId !== user.employeeId) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "このコメントを削除する権限がありません",
          },
        },
        { status: 403 }
      );
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "コメントの削除中にエラーが発生しました",
        },
      },
      { status: 500 }
    );
  }
}

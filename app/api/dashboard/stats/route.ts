/**
 * Dashboard Statistics API
 *
 * GET /api/dashboard/stats
 * Returns dashboard statistics for the authenticated user based on their role.
 *
 * @see CLAUDE.md - API仕様書
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard-stats";

/**
 * GET /api/dashboard/stats
 *
 * Returns:
 * - weeklyReportStatus: Reports submitted this week / total business days
 * - unreadCommentsCount: Number of unread comments (営業 only)
 * - subordinatesReportStatus: Subordinates' report submission status (上長/管理者 only)
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const user = session.user;
    const employeeId = user.employeeId;

    if (!employeeId) {
      return NextResponse.json(
        { error: "従業員情報が見つかりません" },
        { status: 400 }
      );
    }

    // Use the shared dashboard stats helper
    const stats = await getDashboardStats(employeeId, user.role);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

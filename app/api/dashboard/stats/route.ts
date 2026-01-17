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
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/roles";

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

    // Calculate this week's date range (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday (0)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Count business days (Monday-Friday) this week
    const businessDaysThisWeek = calculateBusinessDays(weekStart, weekEnd);

    // Get user's reports this week
    const userReportsThisWeek = await prisma.dailyReport.count({
      where: {
        employeeId,
        reportDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // Count unread comments (comments on user's reports)
    // For simplicity, we're considering all comments as "unread" in this implementation
    // A proper implementation would require a separate "read status" table
    const unreadCommentsCount = await prisma.comment.count({
      where: {
        report: {
          employeeId,
        },
      },
    });

    const stats: any = {
      weeklyReportStatus: {
        submitted: userReportsThisWeek,
        total: businessDaysThisWeek,
        percentage: businessDaysThisWeek > 0
          ? Math.round((userReportsThisWeek / businessDaysThisWeek) * 100)
          : 0,
      },
      unreadCommentsCount,
    };

    // For managers and admins, get subordinates' report status
    if (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN) {
      let subordinates;

      if (user.role === UserRole.MANAGER) {
        // Get direct subordinates
        subordinates = await prisma.employee.findMany({
          where: { managerId: employeeId },
          select: {
            id: true,
            name: true,
          },
        });
      } else {
        // Admin: Get all employees
        subordinates = await prisma.employee.findMany({
          where: {
            id: { not: employeeId },
          },
          select: {
            id: true,
            name: true,
          },
        });
      }

      // Get report counts for each subordinate this week
      const subordinatesStatus = await Promise.all(
        subordinates.map(async (subordinate) => {
          const reportCount = await prisma.dailyReport.count({
            where: {
              employeeId: subordinate.id,
              reportDate: {
                gte: weekStart,
                lte: weekEnd,
              },
            },
          });

          return {
            employeeId: subordinate.id,
            employeeName: subordinate.name,
            submitted: reportCount,
            total: businessDaysThisWeek,
            percentage: businessDaysThisWeek > 0
              ? Math.round((reportCount / businessDaysThisWeek) * 100)
              : 0,
          };
        })
      );

      stats.subordinatesReportStatus = subordinatesStatus;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * Calculate the number of business days (Monday-Friday) between two dates
 */
function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Monday = 1, Friday = 5
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

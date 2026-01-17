/**
 * Dashboard Statistics Helper
 *
 * Shared logic for fetching dashboard statistics.
 * Used by both the dashboard page (Server Component) and API route.
 */

import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, eachDayOfInterval, isWeekend } from "date-fns";
import { ja } from "date-fns/locale";

export interface WeeklyReportStatus {
  submitted: number;
  total: number;
  percentage: number;
}

export interface SubordinateReportStatus {
  employeeId: number;
  employeeName: string;
  submitted: number;
  total: number;
  percentage: number;
}

export interface DashboardStats {
  weeklyReportStatus: WeeklyReportStatus;
  unreadCommentsCount: number;
  subordinatesReportStatus?: SubordinateReportStatus[];
}

/**
 * Calculate the number of business days (Monday-Friday) between two dates
 */
function calculateBusinessDays(startDate: Date, endDate: Date): number {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter(day => !isWeekend(day)).length;
}

/**
 * Get dashboard statistics for a user
 *
 * @param employeeId - The employee ID
 * @param role - The user's role (営業, 上長, or 管理者)
 * @returns Dashboard statistics
 */
export async function getDashboardStats(
  employeeId: number,
  role: string
): Promise<DashboardStats> {
  // Get this week's date range (Monday to Sunday, Japan locale)
  const now = new Date();
  const weekStart = startOfDay(startOfWeek(now, { locale: ja, weekStartsOn: 1 }));
  const weekEnd = endOfDay(endOfWeek(now, { locale: ja, weekStartsOn: 1 }));

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

  const stats: DashboardStats = {
    weeklyReportStatus: {
      submitted: userReportsThisWeek,
      total: businessDaysThisWeek,
      percentage:
        businessDaysThisWeek > 0
          ? Math.round((userReportsThisWeek / businessDaysThisWeek) * 100)
          : 0,
    },
    unreadCommentsCount,
  };

  // For managers and admins, get subordinates' report status
  if (role === "上長" || role === "管理者") {
    let subordinates;

    if (role === "上長") {
      // Get direct subordinates
      subordinates = await prisma.employee.findMany({
        where: { managerId: employeeId },
        select: {
          id: true,
          name: true,
        },
      });
    } else {
      // Admin: Get all employees except self
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

    // Get report counts for all subordinates in a single query (avoid N+1)
    const subordinateIds = subordinates.map((s) => s.id);
    const reportCounts = await prisma.dailyReport.groupBy({
      by: ["employeeId"],
      where: {
        employeeId: { in: subordinateIds },
        reportDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      _count: {
        id: true,
      },
    });

    // Create a map for quick lookup
    const countsMap = new Map(
      reportCounts.map((r) => [r.employeeId, r._count.id])
    );

    // Build subordinates status array
    const subordinatesStatus: SubordinateReportStatus[] = subordinates.map(
      (subordinate) => {
        const submitted = countsMap.get(subordinate.id) || 0;
        return {
          employeeId: subordinate.id,
          employeeName: subordinate.name,
          submitted,
          total: businessDaysThisWeek,
          percentage:
            businessDaysThisWeek > 0
              ? Math.round((submitted / businessDaysThisWeek) * 100)
              : 0,
        };
      }
    );

    stats.subordinatesReportStatus = subordinatesStatus;
  }

  return stats;
}

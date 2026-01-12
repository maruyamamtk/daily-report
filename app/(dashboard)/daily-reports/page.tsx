/**
 * Daily Reports List Page
 *
 * Displays list of daily reports with search and filtering capabilities.
 *
 * @see screen-specification.md - S-03 日報一覧画面
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DailyReportList } from "@/components/features/daily-report/daily-report-list";
import type {
  DailyReportListItem,
  DailyReportListMeta,
  Employee,
} from "@/components/features/daily-report/daily-report-list";
import { UserRole } from "@/types/roles";

export default async function DailyReportsPage() {
  // Get authenticated session
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  // Fetch initial data based on user role
  let whereClause: any = {};
  let employees: Employee[] = [];

  // Build where clause based on user role
  if (user.role === UserRole.SALES) {
    // Sales can only view their own reports
    whereClause.employeeId = user.employeeId;
  } else if (user.role === UserRole.MANAGER) {
    // Manager can view their own and subordinates' reports
    const subordinates = await prisma.employee.findMany({
      where: { managerId: user.employeeId },
      select: { id: true, name: true },
    });

    const viewableIds = [user.employeeId!, ...subordinates.map((s) => s.id)];
    whereClause.employeeId = { in: viewableIds };

    // Get employees for filter dropdown
    employees = [
      { id: user.employeeId!, name: user.name! },
      ...subordinates,
    ];
  } else if (user.role === UserRole.ADMIN) {
    // Admin can view all reports
    // Get all employees for filter dropdown
    const allEmployees = await prisma.employee.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    employees = allEmployees;
  }

  // Get total count
  const totalCount = await prisma.dailyReport.count({ where: whereClause });

  // Fetch initial reports (first page)
  const limit = 20;
  const reports = await prisma.dailyReport.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
        },
      },
      visitRecords: {
        select: {
          id: true,
        },
      },
      comments: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      reportDate: "desc",
    },
    take: limit,
  });

  // Format data for client component
  const formattedReports: DailyReportListItem[] = reports.map((report) => ({
    report_id: report.id,
    employee_id: report.employeeId,
    employee_name: report.employee.name,
    report_date: report.reportDate.toISOString().split("T")[0],
    visit_count: report.visitRecords.length,
    comment_count: report.comments.length,
    unread_comment_count: 0, // TODO: Implement unread comment tracking
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
  }));

  const meta: DailyReportListMeta = {
    current_page: 1,
    total_pages: Math.ceil(totalCount / limit),
    total_count: totalCount,
    limit,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">日報一覧</h1>
        <p className="text-muted-foreground">
          {user.role === UserRole.SALES
            ? "あなたの日報を管理します"
            : user.role === UserRole.MANAGER
            ? "あなたと部下の日報を管理します"
            : "全ての日報を管理します"}
        </p>
      </div>

      <DailyReportList
        initialReports={formattedReports}
        initialMeta={meta}
        employees={employees}
      />
    </div>
  );
}

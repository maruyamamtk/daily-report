/**
 * Dashboard Page (S-02)
 *
 * Main dashboard page showing overview and quick actions.
 * Displays:
 * - Weekly report submission status
 * - Unread comments count
 * - Subordinates' report status (for managers/admins)
 * - Quick action buttons
 *
 * @see CLAUDE.md - 画面定義書 S-02
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SummaryCards } from "@/components/features/dashboard/summary-cards";
import { QuickActions } from "@/components/features/dashboard/quick-actions";
import { SubordinatesTable } from "@/components/features/dashboard/subordinates-table";
import { getDashboardStats } from "@/lib/dashboard-stats";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  // Fetch dashboard stats directly using Prisma (Server Component)
  let dashboardData;
  try {
    if (!user.employeeId) {
      throw new Error("従業員情報が見つかりません");
    }
    dashboardData = await getDashboardStats(user.employeeId, user.role);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Default stats if fetch fails
    dashboardData = {
      weeklyReportStatus: {
        submitted: 0,
        total: 5,
        percentage: 0,
      },
      unreadCommentsCount: 0,
      subordinatesReportStatus: [],
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">
          {user.name}さん、営業日報システムへようこそ
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        weeklyReportStatus={dashboardData.weeklyReportStatus}
        unreadCommentsCount={dashboardData.unreadCommentsCount}
        subordinatesReportStatus={dashboardData.subordinatesReportStatus}
        userRole={user.role}
      />

      {/* Quick Actions */}
      <QuickActions userRole={user.role} />

      {/* Subordinates Report Table (Manager/Admin only) */}
      {(user.role === "上長" || user.role === "管理者") &&
        dashboardData.subordinatesReportStatus &&
        dashboardData.subordinatesReportStatus.length > 0 && (
          <SubordinatesTable
            subordinates={dashboardData.subordinatesReportStatus}
            userRole={user.role}
          />
        )}
    </div>
  );
}

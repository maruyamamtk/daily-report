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

/**
 * Fetch dashboard statistics from the API
 */
async function getDashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }

  try {
    // In server components, we need to call our API directly or use Prisma
    // For simplicity, we'll fetch from our API endpoint using absolute URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      headers: {
        // Pass session token for authentication
        cookie: `next-auth.session-token=${session.user.id}`,
      },
      cache: "no-store", // Disable caching for real-time data
    });

    if (!response.ok) {
      console.error("Failed to fetch dashboard stats:", response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const stats = await getDashboardStats();

  // Default stats if fetch fails
  const defaultStats = {
    weeklyReportStatus: {
      submitted: 0,
      total: 5,
      percentage: 0,
    },
    unreadCommentsCount: 0,
    subordinatesReportStatus: [],
  };

  const dashboardData = stats || defaultStats;

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

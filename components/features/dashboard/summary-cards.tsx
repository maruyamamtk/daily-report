/**
 * Summary Cards Component
 *
 * Displays summary statistics cards on the dashboard.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Users } from "lucide-react";

interface WeeklyReportStatus {
  submitted: number;
  total: number;
  percentage: number;
}

interface SubordinateReportStatus {
  employeeId: number;
  employeeName: string;
  submitted: number;
  total: number;
  percentage: number;
}

interface SummaryCardsProps {
  weeklyReportStatus: WeeklyReportStatus;
  unreadCommentsCount: number;
  subordinatesReportStatus?: SubordinateReportStatus[];
  userRole: string;
}

export function SummaryCards({
  weeklyReportStatus,
  unreadCommentsCount,
  subordinatesReportStatus,
  userRole,
}: SummaryCardsProps) {
  const isManager = userRole === "上長" || userRole === "管理者";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Weekly Report Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            今週の日報提出状況
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {weeklyReportStatus.submitted} / {weeklyReportStatus.total}
          </div>
          <p className="text-xs text-muted-foreground">
            提出率 {weeklyReportStatus.percentage}%
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${weeklyReportStatus.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Unread Comments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            未読コメント件数
          </CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{unreadCommentsCount}</div>
          <p className="text-xs text-muted-foreground">
            {unreadCommentsCount > 0 ? "新しいコメントがあります" : "未読コメントはありません"}
          </p>
        </CardContent>
      </Card>

      {/* Subordinates Report Status (Manager/Admin only) */}
      {isManager && subordinatesReportStatus && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userRole === "管理者" ? "全体の" : "部下の"}日報状況
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subordinatesReportStatus.length}名
            </div>
            <p className="text-xs text-muted-foreground">
              平均提出率{" "}
              {subordinatesReportStatus.length > 0
                ? Math.round(
                    subordinatesReportStatus.reduce(
                      (sum, s) => sum + s.percentage,
                      0
                    ) / subordinatesReportStatus.length
                  )
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

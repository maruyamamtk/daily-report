/**
 * Daily Report Detail Page (S-05)
 *
 * Displays detailed information about a specific daily report including:
 * - Basic information (date, employee, timestamps)
 * - Visit records table
 * - Problem and Plan sections
 * - Comments section
 * - Edit/Delete buttons (for own reports only)
 *
 * @see screen-specification.md - S-05 日報詳細画面
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DailyReportDetailActions } from "@/components/features/daily-report/daily-report-detail-actions";
import { CommentSection } from "@/components/features/daily-report/comment-section";
import { ArrowLeft, Calendar, User, Clock, Edit, Trash2 } from "lucide-react";

interface DailyReportDetailPageProps {
  params: {
    id: string;
  };
}

export default async function DailyReportDetailPage({
  params,
}: DailyReportDetailPageProps) {
  // Get authenticated session
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const reportId = parseInt(params.id);

  if (isNaN(reportId)) {
    notFound();
  }

  // Fetch report with all details
  const report = await prisma.dailyReport.findUnique({
    where: { id: reportId },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          managerId: true,
        },
      },
      visitRecords: {
        include: {
          customer: {
            select: {
              id: true,
              customerName: true,
            },
          },
        },
        orderBy: {
          visitTime: "asc",
        },
      },
      comments: {
        include: {
          commenter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  // Check view permission
  const canView =
    user.role === UserRole.ADMIN ||
    user.employeeId === report.employeeId ||
    (user.role === UserRole.MANAGER && report.employee.managerId === user.employeeId);

  if (!canView) {
    redirect("/daily-reports");
  }

  // Check if user can edit/delete (only own reports)
  const canEdit = user.employeeId === report.employeeId;

  // Check if user can comment (managers and admins)
  const canComment = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;

  // Format dates for display
  const reportDate = report.reportDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const createdAt = report.createdAt.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updatedAt = report.updatedAt.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/daily-reports">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">日報詳細</h1>
          <p className="text-muted-foreground">
            {report.employee.name}の日報 - {reportDate}
          </p>
        </div>

        {/* Action Buttons (Edit/Delete) - Only for own reports */}
        {canEdit && (
          <div className="flex gap-2">
            <Link href={`/daily-reports/${report.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                編集
              </Button>
            </Link>
            <DailyReportDetailActions reportId={report.id} />
          </div>
        )}
      </div>

      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">報告日</p>
                <p className="text-sm text-muted-foreground">{reportDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">営業担当者</p>
                <p className="text-sm text-muted-foreground">{report.employee.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">作成日時</p>
                <p className="text-sm text-muted-foreground">{createdAt}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">更新日時</p>
                <p className="text-sm text-muted-foreground">{updatedAt}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit Records Card */}
      <Card>
        <CardHeader>
          <CardTitle>訪問記録</CardTitle>
          <CardDescription>
            {report.visitRecords.length}件の訪問記録
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>訪問時刻</TableHead>
                <TableHead>顧客名</TableHead>
                <TableHead>訪問内容</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.visitRecords.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {new Date(visit.visitTime).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {visit.customer.customerName}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="whitespace-pre-wrap break-words">
                      {visit.visitContent}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Problem Section */}
      {report.problem && (
        <Card>
          <CardHeader>
            <CardTitle>今日の課題・相談 (Problem)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap break-words">{report.problem}</div>
          </CardContent>
        </Card>
      )}

      {/* Plan Section */}
      {report.plan && (
        <Card>
          <CardHeader>
            <CardTitle>明日の予定 (Plan)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap break-words">{report.plan}</div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle>コメント</CardTitle>
          <CardDescription>
            {report.comments.length > 0
              ? `${report.comments.length}件のコメント`
              : "コメントはまだありません"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommentSection
            reportId={report.id}
            comments={report.comments}
            canComment={canComment}
            currentUserId={user.employeeId || 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}

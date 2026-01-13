/**
 * Daily Report Edit Page
 *
 * Page for editing an existing daily report.
 * Only the report owner can edit their reports.
 *
 * @see screen-specification.md - S-04 日報作成・編集画面
 */

import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DailyReportForm } from "@/components/features/daily-report/daily-report-form";
import { UserRole } from "@/types/roles";

interface EditDailyReportPageProps {
  params: {
    id: string;
  };
}

export default async function EditDailyReportPage({
  params,
}: EditDailyReportPageProps) {
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

  // Fetch report
  const report = await prisma.dailyReport.findUnique({
    where: { id: reportId },
    include: {
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
    },
  });

  if (!report) {
    notFound();
  }

  // Only the report owner can edit
  if (user.employeeId !== report.employeeId) {
    redirect("/daily-reports");
  }

  // Format report data for the form
  const formData = {
    report_date: report.reportDate.toISOString().split("T")[0],
    problem: report.problem || "",
    plan: report.plan || "",
    visits: report.visitRecords.map((visit) => ({
      visit_id: visit.id,
      customer_id: visit.customerId,
      visit_time: new Date(visit.visitTime).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      visit_content: visit.visitContent,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">日報編集</h1>
        <p className="text-muted-foreground">日報の内容を編集します</p>
      </div>

      <DailyReportForm mode="edit" reportId={report.id} initialData={formData} />
    </div>
  );
}

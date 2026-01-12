/**
 * Daily Report Creation Page
 *
 * Page for creating a new daily report.
 *
 * @see screen-specification.md - S-04 日報作成・編集画面
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DailyReportForm } from "@/components/features/daily-report/daily-report-form";
import { UserRole } from "@/types/roles";

export default async function NewDailyReportPage() {
  // Get authenticated session
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  // Only sales and manager can create reports
  if (user.role === UserRole.ADMIN) {
    redirect("/forbidden");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">日報作成</h1>
        <p className="text-muted-foreground">
          新しい日報を作成します
        </p>
      </div>

      <DailyReportForm mode="create" />
    </div>
  );
}

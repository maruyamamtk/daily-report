/**
 * Employees List Page (Admin only)
 *
 * Displays list of employees for management.
 */

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">営業マスタ</h1>
        <p className="text-muted-foreground">
          社員情報を管理します（管理者のみ）
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          営業マスタ機能は実装予定です
        </p>
      </div>
    </div>
  );
}

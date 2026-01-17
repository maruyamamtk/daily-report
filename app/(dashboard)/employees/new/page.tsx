/**
 * Employee Creation Page (Admin only)
 *
 * Allows administrators to create a new employee.
 *
 * @see screen-specification.md - S-09 営業マスタ登録・編集画面
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/types/roles";
import { EmployeeForm } from "@/components/features/employee/employee-form";

export default async function NewEmployeePage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // Check admin role - only administrators can access this page
  if (!isAdmin(session.user.role)) {
    redirect("/");
  }

  // Fetch managers (all employees who could be managers)
  const managers = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get unique departments from existing employees
  const allEmployees = await prisma.employee.findMany({
    select: {
      department: true,
    },
  });
  const departments = Array.from(
    new Set(allEmployees.map((emp) => emp.department))
  ).sort();

  // Get unique positions from existing employees
  const positions = Array.from(
    new Set(allEmployees.map((emp) => emp.position))
  ).sort();

  // Add default departments if none exist
  const defaultDepartments = ["営業部", "営業企画部", "マーケティング部", "管理部"];
  const allDepartments = departments.length > 0 ? departments : defaultDepartments;

  // Add default positions if none exist
  const defaultPositions = ["営業", "主任", "課長", "部長", "本部長"];
  const allPositions = positions.length > 0 ? positions : defaultPositions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">営業登録</h1>
        <p className="text-muted-foreground">
          新しい社員を登録します
        </p>
      </div>

      <EmployeeForm
        mode="create"
        managers={managers}
        departments={allDepartments}
        positions={allPositions}
      />
    </div>
  );
}

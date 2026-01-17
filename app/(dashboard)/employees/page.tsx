/**
 * Employees List Page (Admin only)
 *
 * Displays list of employees for management.
 * This page is only accessible to administrators.
 *
 * @see screen-specification.md - S-08 営業マスタ一覧画面
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/types/roles";
import { EmployeeList } from "@/components/features/employee/employee-list";

export default async function EmployeesPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // Check admin role - only administrators can access this page
  if (!isAdmin(session.user.role)) {
    redirect("/");
  }

  // Fetch employees
  const employees = await prisma.employee.findMany({
    include: {
      manager: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
    take: 100,
  });

  // Get unique departments for filter
  const departments = Array.from(
    new Set(employees.map((emp) => emp.department))
  ).sort();

  // Format employee data
  const employeeData = employees.map((employee) => ({
    employee_id: employee.id,
    name: employee.name,
    email: employee.email,
    department: employee.department,
    position: employee.position,
    manager_id: employee.managerId,
    manager_name: employee.manager?.name ?? null,
    created_at: employee.createdAt.toISOString(),
    updated_at: employee.updatedAt.toISOString(),
  }));

  // Calculate meta information
  const totalCount = await prisma.employee.count();
  const meta = {
    current_page: 1,
    total_pages: Math.ceil(totalCount / 100),
    total_count: totalCount,
    limit: 100,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">営業マスタ</h1>
        <p className="text-muted-foreground">
          社員情報を管理します（管理者のみ）
        </p>
      </div>

      <EmployeeList
        initialEmployees={employeeData}
        initialMeta={meta}
        departments={departments}
      />
    </div>
  );
}

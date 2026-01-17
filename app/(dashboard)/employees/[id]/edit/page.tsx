/**
 * Employee Edit Page (Admin only)
 *
 * Allows administrators to edit an existing employee.
 *
 * @see screen-specification.md - S-09 営業マスタ登録・編集画面
 */

import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/types/roles";
import { EmployeeForm } from "@/components/features/employee/employee-form";

export default async function EditEmployeePage({
  params,
}: {
  params: { id: string };
}) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // Check admin role - only administrators can access this page
  if (!isAdmin(session.user.role)) {
    redirect("/");
  }

  const employeeId = parseInt(params.id);

  if (isNaN(employeeId)) {
    notFound();
  }

  // Fetch employee data
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!employee) {
    notFound();
  }

  // Fetch managers (all employees who could be managers, excluding self)
  const managers = await prisma.employee.findMany({
    where: {
      id: {
        not: employeeId,
      },
    },
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

  // Add default departments if current department not in list
  const defaultDepartments = ["営業部", "営業企画部", "マーケティング部", "管理部"];
  const allDepartments = departments.length > 0 ? departments : defaultDepartments;
  if (!allDepartments.includes(employee.department)) {
    allDepartments.push(employee.department);
    allDepartments.sort();
  }

  // Add default positions if current position not in list
  const defaultPositions = ["営業", "主任", "課長", "部長", "本部長"];
  const allPositions = positions.length > 0 ? positions : defaultPositions;
  if (!allPositions.includes(employee.position)) {
    allPositions.push(employee.position);
    allPositions.sort();
  }

  // Format initial data
  const initialData = {
    name: employee.name,
    email: employee.email,
    department: employee.department,
    position: employee.position,
    manager_id: employee.managerId,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">営業編集</h1>
        <p className="text-muted-foreground">
          社員情報を編集します
        </p>
      </div>

      <EmployeeForm
        mode="edit"
        employeeId={employeeId}
        initialData={initialData}
        managers={managers}
        departments={allDepartments}
        positions={allPositions}
      />
    </div>
  );
}

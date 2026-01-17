/**
 * Employees Options API Route - GET (options)
 *
 * Returns a simplified list of employees for dropdown/select components.
 * Accessible to all authenticated users.
 *
 * @see api-specification.md - 営業マスタAPIセクション
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

/**
 * GET /api/employees/options
 *
 * Get employee options for dropdown/select components.
 * Returns only id and name for all employees.
 *
 * Permissions:
 * - All authenticated users (営業, 上長, 管理者)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { user, error } = await requireApiAuth();
    if (error) return error;

    // Fetch all employees (only id and name)
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Format response
    const data = employees.map((employee) => ({
      employee_id: employee.id,
      name: employee.name,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching employee options:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "営業情報の取得中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

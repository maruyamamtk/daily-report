/**
 * Employees API Routes - GET (detail), PUT (update), DELETE (delete)
 *
 * Handles retrieving, updating, and deleting individual employees.
 * Admin-only access for all operations.
 *
 * @see api-specification.md - 営業マスタAPIセクション
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { UserRole } from "@/types/roles";
import { updateEmployeeSchema } from "@/lib/validators";

/**
 * GET /api/employees/[id]
 *
 * Get employee detail by ID (admin only).
 *
 * Path parameters:
 * - id: Employee ID
 *
 * Permissions:
 * - Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const { user, error } = await requireApiRole(UserRole.ADMIN);
    if (error) return error;

    const employeeId = parseInt(params.id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: { code: "INVALID_PARAMETER", message: "無効な社員IDです" } },
        { status: 400 }
      );
    }

    // Fetch employee
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
      return NextResponse.json(
        { error: { code: "EMPLOYEE_NOT_FOUND", message: "社員が見つかりません" } },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      employee_id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      position: employee.position,
      manager_id: employee.managerId,
      manager_name: employee.manager?.name ?? null,
      created_at: employee.createdAt.toISOString(),
      updated_at: employee.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "営業情報の取得中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/employees/[id]
 *
 * Update employee information (admin only).
 *
 * Path parameters:
 * - id: Employee ID
 *
 * Request body:
 * {
 *   name: string (max 50 chars),
 *   email: string (max 255 chars),
 *   password?: string (min 8 chars, alphanumeric, optional - only if changing),
 *   department: string (max 100 chars),
 *   position: string (max 100 chars),
 *   manager_id?: number | null
 * }
 *
 * Permissions:
 * - Admin only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const { user, error } = await requireApiRole(UserRole.ADMIN);
    if (error) return error;

    const employeeId = parseInt(params.id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: { code: "INVALID_PARAMETER", message: "無効な社員IDです" } },
        { status: 400 }
      );
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: { code: "EMPLOYEE_NOT_FOUND", message: "社員が見つかりません" } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateEmployeeSchema.safeParse(body);

    if (!validation.success) {
      const details = validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "入力内容に誤りがあります",
            details,
          },
        },
        { status: 422 }
      );
    }

    const { name, email, password, department, position, manager_id } = validation.data;

    // Check if email is taken by another employee
    if (email !== existingEmployee.email) {
      const emailTaken = await prisma.employee.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return NextResponse.json(
          {
            error: {
              code: "EMAIL_ALREADY_EXISTS",
              message: "このメールアドレスは既に使用されています",
            },
          },
          { status: 409 }
        );
      }
    }

    // Verify manager exists if manager_id is provided
    if (manager_id !== null && manager_id !== undefined) {
      const manager = await prisma.employee.findUnique({
        where: { id: manager_id },
        select: { id: true },
      });

      if (!manager) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "入力内容に誤りがあります",
              details: [
                {
                  field: "manager_id",
                  message: "指定された上長が見つかりません",
                },
              ],
            },
          },
          { status: 422 }
        );
      }
    }

    // Update employee and associated user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update employee
      const employee = await tx.employee.update({
        where: { id: employeeId },
        data: {
          name,
          email,
          department,
          position,
          managerId: manager_id !== undefined ? manager_id : existingEmployee.managerId,
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update associated user (if exists)
      const existingUser = await tx.user.findFirst({
        where: { employeeId: employeeId },
      });

      if (existingUser) {
        const updateData: Prisma.UserUpdateInput = {
          name,
          email,
        };

        // Only update password if provided
        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updateData.password = hashedPassword;
        }

        await tx.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });
      }

      return employee;
    });

    // Format response
    const response = {
      employee_id: result.id,
      name: result.name,
      email: result.email,
      department: result.department,
      position: result.position,
      manager_id: result.managerId,
      manager_name: result.manager?.name ?? null,
      created_at: result.createdAt.toISOString(),
      updated_at: result.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating employee:", error);

    // Check for unique constraint violation (email)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        {
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: "このメールアドレスは既に使用されています",
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "営業の更新中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/employees/[id]
 *
 * Delete an employee (admin only).
 * Cannot delete if the employee is used in daily reports, customers, or comments.
 *
 * Path parameters:
 * - id: Employee ID
 *
 * Permissions:
 * - Admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const { user, error } = await requireApiRole(UserRole.ADMIN);
    if (error) return error;

    const employeeId = parseInt(params.id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: { code: "INVALID_PARAMETER", message: "無効な社員IDです" } },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        dailyReports: {
          select: { id: true },
        },
        customers: {
          select: { id: true },
        },
        comments: {
          select: { id: true },
        },
        subordinates: {
          select: { id: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: { code: "EMPLOYEE_NOT_FOUND", message: "社員が見つかりません" } },
        { status: 404 }
      );
    }

    // Check if employee is used in daily reports, customers, comments, or as a manager
    if (
      employee.dailyReports.length > 0 ||
      employee.customers.length > 0 ||
      employee.comments.length > 0 ||
      employee.subordinates.length > 0
    ) {
      return NextResponse.json(
        {
          error: {
            code: "EMPLOYEE_IN_USE",
            message: "この社員は日報や顧客で使用されているため削除できません",
          },
        },
        { status: 409 }
      );
    }

    // Delete employee and associated user in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete associated user if exists
      const existingUser = await tx.user.findFirst({
        where: { employeeId: employeeId },
      });

      if (existingUser) {
        await tx.user.delete({
          where: { id: existingUser.id },
        });
      }

      // Delete employee
      await tx.employee.delete({
        where: { id: employeeId },
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "営業の削除中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

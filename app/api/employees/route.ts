/**
 * Employees API Routes - GET (list) and POST (create)
 *
 * Handles listing employees and creating new employees.
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
import { createEmployeeSchema } from "@/lib/validators";

/**
 * GET /api/employees
 *
 * Get a list of employees (admin only).
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - name: Filter by employee name (partial match)
 * - department: Filter by department
 *
 * Permissions:
 * - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const { user, error } = await requireApiRole(UserRole.ADMIN);
    if (error) return error;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const name = searchParams.get("name");
    const department = searchParams.get("department");

    // Validate search parameters
    if (name && name.length > 50) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "検索文字列が長すぎます（最大50文字）",
          },
        },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {};
    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }
    if (department) {
      where.department = department;
    }

    // Get total count with filters
    const totalCount = await prisma.employee.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch employees with manager information
    const employees = await prisma.employee.findMany({
      where,
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
      skip,
      take: limit,
    });

    // Format response
    const data = employees.map((employee) => ({
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

    return NextResponse.json({
      data,
      meta: {
        current_page: page,
        total_pages: totalPages,
        total_count: totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "営業情報の取得中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/employees
 *
 * Create a new employee (admin only).
 *
 * Request body:
 * {
 *   name: string (max 50 chars),
 *   email: string (unique, max 255 chars),
 *   password: string (min 8 chars, alphanumeric),
 *   department: string (max 100 chars),
 *   position: string (max 100 chars),
 *   manager_id?: number
 * }
 *
 * Permissions:
 * - Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    const { user, error } = await requireApiRole(UserRole.ADMIN);
    if (error) return error;

    // Parse and validate request body
    const body = await request.json();
    const validation = createEmployeeSchema.safeParse(body);

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

    // Check if email already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });

    if (existingEmployee) {
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

    // Verify manager exists if manager_id is provided
    if (manager_id) {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create employee and associated user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create employee
      const employee = await tx.employee.create({
        data: {
          name,
          email,
          department,
          position,
          managerId: manager_id ?? null,
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

      // Create associated user account
      await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: UserRole.SALES, // Default role is 営業
          employeeId: employee.id,
        },
      });

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

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);

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
      { error: { code: "INTERNAL_SERVER_ERROR", message: "営業の作成中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

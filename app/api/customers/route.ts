/**
 * Customers API Routes - GET (list) and POST (create)
 *
 * Handles listing customers and creating new customers.
 *
 * @see api-specification.md - 顧客マスタAPIセクション
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";
import { createCustomerSchema } from "@/lib/validators";

/**
 * GET /api/customers
 *
 * Get a list of customers.
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 100, max: 500)
 * - customer_name: Filter by customer name (partial match)
 * - employee_id: Filter by assigned employee ID
 *
 * Permissions:
 * - All authenticated users can view customers
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { user, error } = await requireApiAuth();
    if (error) return error;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const customerName = searchParams.get("customer_name");
    const employeeId = searchParams.get("employee_id");

    // Build where clause
    const where: any = {};
    if (customerName) {
      where.customerName = {
        contains: customerName,
        mode: "insensitive",
      };
    }
    if (employeeId) {
      where.assignedEmployeeId = parseInt(employeeId);
    }

    // Get total count with filters
    const totalCount = await prisma.customer.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch customers with assigned employee
    const customers = await prisma.customer.findMany({
      where,
      include: {
        assignedEmployee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        customerName: "asc",
      },
      skip,
      take: limit,
    });

    // Format response
    const data = customers.map((customer) => ({
      customer_id: customer.id,
      customer_name: customer.customerName,
      address: customer.address,
      phone: customer.phone,
      email: customer.email,
      assigned_employee_id: customer.assignedEmployeeId,
      assigned_employee_name: customer.assignedEmployee.name,
      created_at: customer.createdAt.toISOString(),
      updated_at: customer.updatedAt.toISOString(),
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
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "顧客情報の取得中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 *
 * Create a new customer.
 *
 * Request body:
 * {
 *   customer_name: string (max 100 chars),
 *   address?: string (max 255 chars),
 *   phone?: string (max 20 chars, digits and hyphens only),
 *   email?: string (email format, max 255 chars),
 *   assigned_employee_id: number
 * }
 *
 * Permissions:
 * - All authenticated users can create customers
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error } = await requireApiAuth();
    if (error) return error;

    // Parse and validate request body
    const body = await request.json();
    const validation = createCustomerSchema.safeParse(body);

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

    const { customer_name, address, phone, email, assigned_employee_id } = validation.data;

    // Verify assigned employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: assigned_employee_id },
      select: { id: true, name: true },
    });

    if (!employee) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "入力内容に誤りがあります",
            details: [
              {
                field: "assigned_employee_id",
                message: "指定された担当営業が見つかりません",
              },
            ],
          },
        },
        { status: 422 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        customerName: customer_name,
        address: address ?? null,
        phone: phone ?? null,
        email: email ?? null,
        assignedEmployeeId: assigned_employee_id,
      },
      include: {
        assignedEmployee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Format response
    const response = {
      customer_id: customer.id,
      customer_name: customer.customerName,
      address: customer.address,
      phone: customer.phone,
      email: customer.email,
      assigned_employee_id: customer.assignedEmployeeId,
      assigned_employee_name: customer.assignedEmployee.name,
      created_at: customer.createdAt.toISOString(),
      updated_at: customer.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "顧客の作成中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

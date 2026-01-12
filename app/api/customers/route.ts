/**
 * Customers API Routes - GET (list)
 *
 * Handles listing customers for selection in forms.
 *
 * @see api-specification.md - 顧客マスタAPIセクション
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";

/**
 * GET /api/customers
 *
 * Get a list of customers.
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 100, max: 500)
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

    // Get total count
    const totalCount = await prisma.customer.count();

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch customers with assigned employee
    const customers = await prisma.customer.findMany({
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

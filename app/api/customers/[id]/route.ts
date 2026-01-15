/**
 * Customers API Routes - GET (detail), PUT (update), DELETE (delete)
 *
 * Handles retrieving, updating, and deleting individual customers.
 *
 * @see api-specification.md - 顧客マスタAPIセクション
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth";
import { updateCustomerSchema } from "@/lib/validators";

/**
 * GET /api/customers/[id]
 *
 * Get customer detail by ID.
 *
 * Path parameters:
 * - id: Customer ID
 *
 * Permissions:
 * - All authenticated users can view customer details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const { user, error } = await requireApiAuth();
    if (error) return error;

    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: { code: "INVALID_PARAMETER", message: "無効な顧客IDです" } },
        { status: 400 }
      );
    }

    // Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        assignedEmployee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: { code: "CUSTOMER_NOT_FOUND", message: "顧客が見つかりません" } },
        { status: 404 }
      );
    }

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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "顧客情報の取得中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/customers/[id]
 *
 * Update customer information.
 *
 * Path parameters:
 * - id: Customer ID
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
 * - All authenticated users can update customers
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const { user, error } = await requireApiAuth();
    if (error) return error;

    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: { code: "INVALID_PARAMETER", message: "無効な顧客IDです" } },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: { code: "CUSTOMER_NOT_FOUND", message: "顧客が見つかりません" } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateCustomerSchema.safeParse(body);

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

    // Update customer
    const customer = await prisma.customer.update({
      where: { id: customerId },
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "顧客の更新中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/[id]
 *
 * Delete a customer.
 * Cannot delete if the customer is used in visit records.
 *
 * Path parameters:
 * - id: Customer ID
 *
 * Permissions:
 * - All authenticated users can delete customers
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const { user, error } = await requireApiAuth();
    if (error) return error;

    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: { code: "INVALID_PARAMETER", message: "無効な顧客IDです" } },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        visitRecords: {
          select: { id: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: { code: "CUSTOMER_NOT_FOUND", message: "顧客が見つかりません" } },
        { status: 404 }
      );
    }

    // Check if customer is used in visit records
    if (customer.visitRecords.length > 0) {
      return NextResponse.json(
        { error: { code: "CUSTOMER_IN_USE", message: "この顧客は訪問記録で使用されているため削除できません" } },
        { status: 409 }
      );
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id: customerId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "顧客の削除中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

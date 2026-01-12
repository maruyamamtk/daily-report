/**
 * Daily Reports API Routes - GET (list) and POST (create)
 *
 * Handles listing daily reports with pagination and creating new reports.
 *
 * @see api-specification.md - 日報APIセクション
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, canApiViewReport } from "@/lib/api-auth";
import { createDailyReportSchema } from "@/lib/validators";
import { UserRole } from "@/types/roles";
import { z } from "zod";

/**
 * GET /api/daily-reports
 *
 * Get a list of daily reports with pagination and filtering.
 *
 * Query parameters:
 * - date_from: Start date filter (YYYY-MM-DD)
 * - date_to: End date filter (YYYY-MM-DD)
 * - employee_id: Filter by employee ID (managers/admins only)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 *
 * Permissions:
 * - Sales: Can only view their own reports
 * - Manager: Can view their own and subordinates' reports
 * - Admin: Can view all reports
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { user, error } = await requireApiAuth();
    if (error) return error;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const employeeIdParam = searchParams.get("employee_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Build where clause based on user role
    let whereClause: any = {};

    // Date filters
    if (dateFrom || dateTo) {
      whereClause.reportDate = {};
      if (dateFrom) {
        whereClause.reportDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.reportDate.lte = new Date(dateTo);
      }
    }

    // Employee filter based on role
    if (user!.role === UserRole.SALES) {
      // Sales can only view their own reports
      whereClause.employeeId = user!.employeeId;
    } else if (user!.role === UserRole.MANAGER) {
      // Manager can view their own and subordinates' reports
      const subordinateIds = await prisma.employee.findMany({
        where: { managerId: user!.employeeId },
        select: { id: true },
      });
      const viewableIds = [
        user!.employeeId!,
        ...subordinateIds.map((s) => s.id),
      ];

      if (employeeIdParam) {
        const requestedId = parseInt(employeeIdParam);
        if (viewableIds.includes(requestedId)) {
          whereClause.employeeId = requestedId;
        } else {
          return NextResponse.json(
            { error: { code: "PERMISSION_DENIED", message: "この社員の日報を閲覧する権限がありません" } },
            { status: 403 }
          );
        }
      } else {
        whereClause.employeeId = { in: viewableIds };
      }
    } else if (user!.role === UserRole.ADMIN) {
      // Admin can view all reports
      if (employeeIdParam) {
        whereClause.employeeId = parseInt(employeeIdParam);
      }
    }

    // Get total count
    const totalCount = await prisma.dailyReport.count({ where: whereClause });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch reports with related data
    const reports = await prisma.dailyReport.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
        visitRecords: {
          select: {
            id: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        reportDate: "desc",
      },
      skip,
      take: limit,
    });

    // Format response
    const data = reports.map((report) => ({
      report_id: report.id,
      employee_id: report.employeeId,
      employee_name: report.employee.name,
      report_date: report.reportDate.toISOString().split("T")[0],
      visit_count: report.visitRecords.length,
      comment_count: report.comments.length,
      unread_comment_count: 0, // TODO: Implement unread comment tracking
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
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
    console.error("Error fetching daily reports:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "日報の取得中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daily-reports
 *
 * Create a new daily report with visit records.
 *
 * Request body:
 * {
 *   report_date: string (YYYY-MM-DD),
 *   problem?: string (max 1000 chars),
 *   plan?: string (max 1000 chars),
 *   visits: Array<{
 *     customer_id: number,
 *     visit_time: string (HH:MM),
 *     visit_content: string (max 500 chars)
 *   }> (min 1 item)
 * }
 *
 * Permissions:
 * - Sales and Manager can create reports
 * - Creates report for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error } = await requireApiAuth();
    if (error) return error;

    // Only sales and manager can create reports
    if (user!.role === UserRole.ADMIN) {
      return NextResponse.json(
        { error: { code: "PERMISSION_DENIED", message: "管理者は日報を作成できません" } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createDailyReportSchema.safeParse(body);

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

    const { report_date, problem, plan, visits } = validation.data;

    // Check if report already exists for this date
    const existingReport = await prisma.dailyReport.findUnique({
      where: {
        employee_report_date_unique: {
          employeeId: user!.employeeId!,
          reportDate: new Date(report_date),
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: { code: "REPORT_ALREADY_EXISTS", message: "指定日の日報は既に作成されています" } },
        { status: 409 }
      );
    }

    // Verify all customers exist
    const customerIds = visits.map((v) => v.customer_id);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, customerName: true },
    });

    if (customers.length !== customerIds.length) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "存在しない顧客が含まれています" } },
        { status: 422 }
      );
    }

    // Create report with visit records in a transaction
    const report = await prisma.dailyReport.create({
      data: {
        employeeId: user!.employeeId!,
        reportDate: new Date(report_date),
        problem: problem || null,
        plan: plan || null,
        visitRecords: {
          create: visits.map((visit) => ({
            customerId: visit.customer_id,
            visitTime: new Date(`1970-01-01T${visit.visit_time}:00Z`),
            visitContent: visit.visit_content,
          })),
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
        visitRecords: {
          include: {
            customer: {
              select: {
                id: true,
                customerName: true,
              },
            },
          },
        },
        comments: true,
      },
    });

    // Format response
    const response = {
      report_id: report.id,
      employee_id: report.employeeId,
      employee_name: report.employee.name,
      report_date: report.reportDate.toISOString().split("T")[0],
      problem: report.problem,
      plan: report.plan,
      visits: report.visitRecords.map((visit) => ({
        visit_id: visit.id,
        customer_id: visit.customerId,
        customer_name: visit.customer.customerName,
        visit_time: visit.visitTime.toISOString().substring(11, 16),
        visit_content: visit.visitContent,
        created_at: visit.createdAt.toISOString(),
      })),
      comments: [],
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating daily report:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "日報の作成中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

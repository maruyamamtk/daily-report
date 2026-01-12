/**
 * Daily Report API Routes - GET, PUT, DELETE (by ID)
 *
 * Handles retrieving, updating, and deleting a specific daily report.
 *
 * @see api-specification.md - 日報APIセクション
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, canApiEditReport, canApiViewReport } from "@/lib/api-auth";
import { updateDailyReportSchema } from "@/lib/validators";
import { UserRole } from "@/types/roles";

/**
 * GET /api/daily-reports/:id
 *
 * Get a specific daily report with all details.
 *
 * Permissions:
 * - Sales: Can only view their own reports
 * - Manager: Can view their own and subordinates' reports
 * - Admin: Can view all reports
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "無効な日報IDです" } },
        { status: 400 }
      );
    }

    // Fetch report
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            managerId: true,
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
          orderBy: {
            visitTime: "asc",
          },
        },
        comments: {
          include: {
            commenter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: { code: "REPORT_NOT_FOUND", message: "日報が見つかりません" } },
        { status: 404 }
      );
    }

    // Check view permission
    const { canView, error } = await canApiViewReport(
      report.employeeId,
      report.employee.managerId
    );

    if (error) return error;

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
      comments: report.comments.map((comment) => ({
        comment_id: comment.id,
        commenter_id: comment.commenterId,
        commenter_name: comment.commenter.name,
        comment_content: comment.commentContent,
        created_at: comment.createdAt.toISOString(),
      })),
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching daily report:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "日報の取得中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/daily-reports/:id
 *
 * Update a daily report and its visit records.
 *
 * Request body:
 * {
 *   report_date: string (YYYY-MM-DD),
 *   problem?: string (max 1000 chars),
 *   plan?: string (max 1000 chars),
 *   visits: Array<{
 *     visit_id?: number (for existing visits),
 *     customer_id: number,
 *     visit_time: string (HH:MM),
 *     visit_content: string (max 500 chars)
 *   }> (min 1 item)
 * }
 *
 * Notes:
 * - Visits with visit_id are updated
 * - Visits without visit_id are created
 * - Existing visits not included in the request are deleted
 *
 * Permissions:
 * - Users can only update their own reports
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "無効な日報IDです" } },
        { status: 400 }
      );
    }

    // Fetch existing report
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        visitRecords: true,
      },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: { code: "REPORT_NOT_FOUND", message: "日報が見つかりません" } },
        { status: 404 }
      );
    }

    // Check edit permission
    const { canEdit, error } = await canApiEditReport(existingReport.employeeId);
    if (error) return error;

    // Parse and validate request body
    const body = await request.json();
    const validation = updateDailyReportSchema.safeParse(body);

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

    // Check if changing date would conflict with another report
    const newDate = new Date(report_date);
    if (newDate.getTime() !== existingReport.reportDate.getTime()) {
      const conflictingReport = await prisma.dailyReport.findUnique({
        where: {
          employee_report_date_unique: {
            employeeId: existingReport.employeeId,
            reportDate: newDate,
          },
        },
      });

      if (conflictingReport) {
        return NextResponse.json(
          { error: { code: "REPORT_ALREADY_EXISTS", message: "指定日の日報は既に作成されています" } },
          { status: 409 }
        );
      }
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

    // Separate visits into create, update, and delete
    const visitsToUpdate = visits.filter((v) => v.visit_id);
    const visitsToCreate = visits.filter((v) => !v.visit_id);
    const existingVisitIds = existingReport.visitRecords.map((v) => v.id);
    const requestedVisitIds = visitsToUpdate
      .map((v) => v.visit_id)
      .filter((id): id is number => id !== undefined);
    const visitsToDelete = existingVisitIds.filter(
      (id) => !requestedVisitIds.includes(id)
    );

    // Update report and visit records in a transaction
    const updatedReport = await prisma.$transaction(async (tx) => {
      // Delete removed visits
      if (visitsToDelete.length > 0) {
        await tx.visitRecord.deleteMany({
          where: {
            id: { in: visitsToDelete },
            reportId: reportId,
          },
        });
      }

      // Update existing visits
      for (const visit of visitsToUpdate) {
        await tx.visitRecord.update({
          where: { id: visit.visit_id },
          data: {
            customerId: visit.customer_id,
            visitTime: new Date(`1970-01-01T${visit.visit_time}:00Z`),
            visitContent: visit.visit_content,
          },
        });
      }

      // Create new visits
      if (visitsToCreate.length > 0) {
        await tx.visitRecord.createMany({
          data: visitsToCreate.map((visit) => ({
            reportId: reportId,
            customerId: visit.customer_id,
            visitTime: new Date(`1970-01-01T${visit.visit_time}:00Z`),
            visitContent: visit.visit_content,
          })),
        });
      }

      // Update report
      return await tx.dailyReport.update({
        where: { id: reportId },
        data: {
          reportDate: newDate,
          problem: problem || null,
          plan: plan || null,
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
            orderBy: {
              visitTime: "asc",
            },
          },
          comments: {
            include: {
              commenter: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    });

    // Format response
    const response = {
      report_id: updatedReport.id,
      employee_id: updatedReport.employeeId,
      employee_name: updatedReport.employee.name,
      report_date: updatedReport.reportDate.toISOString().split("T")[0],
      problem: updatedReport.problem,
      plan: updatedReport.plan,
      visits: updatedReport.visitRecords.map((visit) => ({
        visit_id: visit.id,
        customer_id: visit.customerId,
        customer_name: visit.customer.customerName,
        visit_time: visit.visitTime.toISOString().substring(11, 16),
        visit_content: visit.visitContent,
        created_at: visit.createdAt.toISOString(),
      })),
      comments: updatedReport.comments.map((comment) => ({
        comment_id: comment.id,
        commenter_id: comment.commenterId,
        commenter_name: comment.commenter.name,
        comment_content: comment.commentContent,
        created_at: comment.createdAt.toISOString(),
      })),
      created_at: updatedReport.createdAt.toISOString(),
      updated_at: updatedReport.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating daily report:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "日報の更新中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/daily-reports/:id
 *
 * Delete a daily report and all its visit records and comments.
 *
 * Permissions:
 * - Users can only delete their own reports
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "無効な日報IDです" } },
        { status: 400 }
      );
    }

    // Fetch existing report
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: { code: "REPORT_NOT_FOUND", message: "日報が見つかりません" } },
        { status: 404 }
      );
    }

    // Check edit permission (same as delete permission)
    const { canEdit, error } = await canApiEditReport(existingReport.employeeId);
    if (error) return error;

    // Delete report (cascading delete will remove visit records and comments)
    await prisma.dailyReport.delete({
      where: { id: reportId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting daily report:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "日報の削除中にエラーが発生しました" } },
      { status: 500 }
    );
  }
}

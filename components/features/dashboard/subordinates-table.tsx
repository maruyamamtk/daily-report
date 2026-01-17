/**
 * Subordinates Report Table Component
 *
 * Displays a table of subordinates' report submission status (for managers/admins).
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubordinateReportStatus } from "@/lib/dashboard-stats";

interface SubordinatesTableProps {
  subordinates: SubordinateReportStatus[];
  userRole: string;
}

export function SubordinatesTable({ subordinates, userRole }: SubordinatesTableProps) {
  if (!subordinates || subordinates.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {userRole === "管理者" ? "全体の" : "部下の"}日報提出状況
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>社員名</TableHead>
                <TableHead className="text-center">提出済み</TableHead>
                <TableHead className="text-center">合計</TableHead>
                <TableHead className="text-center">提出率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subordinates.map((subordinate) => (
                <TableRow key={subordinate.employeeId}>
                  <TableCell className="font-medium">
                    {subordinate.employeeName}
                  </TableCell>
                  <TableCell className="text-center">
                    {subordinate.submitted}
                  </TableCell>
                  <TableCell className="text-center">
                    {subordinate.total}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={
                          subordinate.percentage >= 80
                            ? "text-green-600"
                            : subordinate.percentage >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {subordinate.percentage}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

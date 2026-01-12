"use client";

/**
 * Daily Report List Component
 *
 * Displays a list of daily reports with search filters and pagination.
 *
 * @see screen-specification.md - S-03 日報一覧画面
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Edit,
  Trash2,
  Search,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCurrentUser } from "@/lib/use-auth";
import { UserRole } from "@/types/roles";

export interface DailyReportListItem {
  report_id: number;
  employee_id: number;
  employee_name: string;
  report_date: string;
  visit_count: number;
  comment_count: number;
  unread_comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface DailyReportListMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
}

export interface Employee {
  id: number;
  name: string;
}

interface DailyReportListProps {
  initialReports: DailyReportListItem[];
  initialMeta: DailyReportListMeta;
  employees?: Employee[];
}

export function DailyReportList({
  initialReports,
  initialMeta,
  employees = [],
}: DailyReportListProps) {
  const router = useRouter();
  const user = useCurrentUser();

  // State for search filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // State for data
  const [reports, setReports] = useState<DailyReportListItem[]>(initialReports);
  const [meta, setMeta] = useState<DailyReportListMeta>(initialMeta);

  // Check if user can filter by employee (managers and admins only)
  const canFilterByEmployee =
    user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  // Check if user can edit a report
  const canEdit = (report: DailyReportListItem) => {
    return user?.employeeId === report.employee_id;
  };

  // Handle search
  const handleSearch = async (page: number = 1) => {
    setIsSearching(true);

    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (employeeId) params.set("employee_id", employeeId);
    params.set("page", page.toString());
    params.set("limit", meta.limit.toString());

    try {
      const response = await fetch(`/api/daily-reports?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch daily reports");
      }

      const result = await response.json();
      setReports(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error("Error fetching daily reports:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle clear filters
  const handleClear = () => {
    setDateFrom("");
    setDateTo("");
    setEmployeeId("");
    setReports(initialReports);
    setMeta(initialMeta);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    handleSearch(page);
  };

  // Handle view report
  const handleView = (reportId: number) => {
    router.push(`/daily-reports/${reportId}`);
  };

  // Handle edit report
  const handleEdit = (reportId: number) => {
    router.push(`/daily-reports/${reportId}/edit`);
  };

  // Handle delete report
  const handleDelete = async (reportId: number) => {
    if (!confirm("この日報を削除してもよろしいですか?")) {
      return;
    }

    try {
      const response = await fetch(`/api/daily-reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete daily report");
      }

      // Refresh the list
      handleSearch(meta.current_page);
    } catch (error) {
      console.error("Error deleting daily report:", error);
      alert("日報の削除に失敗しました");
    }
  };

  // Handle create new report
  const handleCreate = () => {
    router.push("/daily-reports/new");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="date-from">報告日（From）</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="date-to">報告日（To）</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Employee Filter (Manager/Admin only) */}
            {canFilterByEmployee && employees.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="employee">営業担当者</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="全て" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全て</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Search Buttons */}
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => handleSearch(1)}
              disabled={isSearching}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              検索
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isSearching}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              クリア
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* Reports Table */}
      <Card>
        <CardContent className="pt-6">
          {reports.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              日報が見つかりませんでした
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>報告日</TableHead>
                      {canFilterByEmployee && (
                        <TableHead>営業担当者</TableHead>
                      )}
                      <TableHead className="text-center">訪問件数</TableHead>
                      <TableHead className="text-center">
                        コメント数
                      </TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.report_id}>
                        <TableCell className="font-medium">
                          {formatDate(report.report_date)}
                        </TableCell>
                        {canFilterByEmployee && (
                          <TableCell>{report.employee_name}</TableCell>
                        )}
                        <TableCell className="text-center">
                          {report.visit_count}件
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span>{report.comment_count}件</span>
                            {report.unread_comment_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {report.unread_comment_count}件未読
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(report.report_id)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              詳細
                            </Button>
                            {canEdit(report) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(report.report_id)}
                                  className="gap-1"
                                >
                                  <Edit className="h-4 w-4" />
                                  編集
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(report.report_id)}
                                  className="gap-1 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  削除
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta.total_pages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {meta.total_count}件中{" "}
                    {(meta.current_page - 1) * meta.limit + 1}-
                    {Math.min(meta.current_page * meta.limit, meta.total_count)}
                    件を表示
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(meta.current_page - 1)}
                      disabled={meta.current_page === 1 || isSearching}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      前へ
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm">
                        {meta.current_page} / {meta.total_pages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(meta.current_page + 1)}
                      disabled={
                        meta.current_page === meta.total_pages || isSearching
                      }
                    >
                      次へ
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

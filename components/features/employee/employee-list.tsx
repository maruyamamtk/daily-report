"use client";

/**
 * Employee List Component
 *
 * Displays a list of employees with search filters and pagination.
 * Admin-only component for managing employee master data.
 *
 * @see screen-specification.md - S-08 営業マスタ一覧画面
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Edit,
  Trash2,
  Search,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export interface EmployeeListItem {
  employee_id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  manager_id: number | null;
  manager_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeListMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
}

interface EmployeeListProps {
  initialEmployees: EmployeeListItem[];
  initialMeta: EmployeeListMeta;
  departments: string[];
}

export function EmployeeList({
  initialEmployees,
  initialMeta,
  departments,
}: EmployeeListProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State for search filters
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // State for data
  const [employees, setEmployees] = useState<EmployeeListItem[]>(initialEmployees);
  const [meta, setMeta] = useState<EmployeeListMeta>(initialMeta);

  // State for error handling
  const [error, setError] = useState<string | null>(null);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle search
  const handleSearch = async (page: number = 1) => {
    setIsSearching(true);
    setError(null);

    const params = new URLSearchParams();
    if (name.trim()) params.set("name", name.trim());
    if (department) params.set("department", department);
    params.set("page", page.toString());
    params.set("limit", meta.limit.toString());

    try {
      const response = await fetch(`/api/employees?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const result = await response.json();
      setEmployees(result.data);
      setMeta(result.meta);
    } catch (error) {
      const errorMessage = "社員情報の取得に失敗しました。もう一度お試しください。";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "エラー",
        description: errorMessage,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle clear filters
  const handleClear = () => {
    setName("");
    setDepartment("");
    setEmployees(initialEmployees);
    setMeta(initialMeta);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    handleSearch(page);
  };

  // Handle edit employee
  const handleEdit = (employeeId: number) => {
    router.push(`/employees/${employeeId}/edit`);
  };

  // Handle delete employee - opens confirmation dialog
  const handleDelete = (employeeId: number, employeeName: string) => {
    setEmployeeToDelete({ id: employeeId, name: employeeName });
    setDeleteDialogOpen(true);
  };

  // Confirm and execute delete
  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/employees/${employeeToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.code === "EMPLOYEE_IN_USE") {
          toast({
            variant: "destructive",
            title: "削除できません",
            description: "この社員は日報や顧客で使用されているため削除できません",
          });
        } else {
          throw new Error("Failed to delete employee");
        }
        return;
      }

      // Success
      toast({
        title: "削除しました",
        description: `${employeeToDelete.name}を削除しました`,
      });

      // Refresh the list
      handleSearch(meta.current_page);
    } catch (error) {
      const errorMessage = "社員の削除に失敗しました。もう一度お試しください。";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "エラー",
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  // Handle create new employee
  const handleCreate = () => {
    router.push("/employees/new");
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Employee Name */}
            <div className="space-y-2">
              <Label htmlFor="employee-name">社員名</Label>
              <Input
                id="employee-name"
                type="text"
                placeholder="社員名で検索"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <Label htmlFor="department">部署</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="全て" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全て</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          新規登録
        </Button>
      </div>

      {/* Employees Table */}
      <Card>
        <CardContent className="pt-6">
          {employees.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              社員が見つかりませんでした
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>社員ID</TableHead>
                      <TableHead>社員名</TableHead>
                      <TableHead>メールアドレス</TableHead>
                      <TableHead>部署</TableHead>
                      <TableHead>役職</TableHead>
                      <TableHead>上長名</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.employee_id}>
                        <TableCell className="font-medium">
                          {employee.employee_id}
                        </TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{employee.manager_name || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(employee.employee_id)}
                              className="gap-1"
                              aria-label={`${employee.name}を編集`}
                            >
                              <Edit className="h-4 w-4" />
                              編集
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(employee.employee_id, employee.name)}
                              className="gap-1 text-destructive hover:text-destructive"
                              aria-label={`${employee.name}を削除`}
                            >
                              <Trash2 className="h-4 w-4" />
                              削除
                            </Button>
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

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>社員を削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              {employeeToDelete && (
                <>
                  <strong>{employeeToDelete.name}</strong>を削除しようとしています。
                  <br />
                  この操作は取り消せません。本当に削除してもよろしいですか?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
